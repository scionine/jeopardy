const API_URL = "https://rithm-jeopardy.herokuapp.com/api/";
const NUMBER_OF_CATEGORIES = 6;
const NUMBER_OF_CLUES_PER_CATEGORY = 5;

let categories = [];
let activeClue = null;
let activeClueMode = 0;

$("#play").on("click", handleClickOfPlay);

function handleClickOfPlay() {
  setupTheGame(); // Restart game always allowed
}

async function setupTheGame() {
  $("#spinner").removeClass("disabled");
  $("#categories").empty();
  $("#clues").empty();
  $("#active-clue").html("");
  $("thead").addClass("hidden");
  $("#play").text("Restart the Game!");
  categories = [];
  activeClue = null;
  activeClueMode = 0;

  const categoryIds = await getCategoryIds();
  for (let id of categoryIds) {
    const catData = await getCategoryData(id);
    categories.push(catData);
  }

  fillTable(categories);
  $("#spinner").addClass("disabled");
}

async function getCategoryIds() {
  const res = await axios.get(`${API_URL}categories?count=100`);
  const validCategories = res.data.filter(
    (cat) => cat.clues_count >= NUMBER_OF_CLUES_PER_CATEGORY
  );
  const selected = _.sampleSize(validCategories, NUMBER_OF_CATEGORIES);
  return selected.map((cat) => cat.id);
}

async function getCategoryData(categoryId) {
  const res = await axios.get(`${API_URL}category?id=${categoryId}`);
  const allClues = res.data.clues
    .filter((clue) => clue.question && clue.answer)
    .slice(0, NUMBER_OF_CLUES_PER_CATEGORY)
    .map((clue, i) => ({
      id: clue.id,
      question: clue.question,
      answer: clue.answer,
      value: clue.value || (i + 1) * 100,
    }));

  return {
    id: categoryId,
    title: res.data.title,
    clues: allClues,
  };
}

function fillTable(categories) {
  $("#categories").empty();
  $("#clues").empty();

  for (let cat of categories) {
    $("#categories").append($("<th>").text(cat.title));
  }

  $("thead").removeClass("hidden");

  for (let row = 0; row < NUMBER_OF_CLUES_PER_CATEGORY; row++) {
    const $tr = $("<tr>");
    for (let cat of categories) {
      const clue = cat.clues[row];
      const $td = $("<td>");
      const $clueDiv = $("<div>")
        .addClass("clue")
        .attr("id", `${cat.id}-${clue.id}`)
        .text(`$${clue.value}`);
      $td.append($clueDiv);
      $tr.append($td);
    }
    $("#clues").append($tr);
  }

  $(".clue").on("click", handleClickOfClue);
}

function handleClickOfClue(event) {
  if (activeClueMode !== 0) return;

  const [catId, clueId] = event.target.id.split("-").map(Number);
  const cat = categories.find((c) => c.id === catId);
  const clueIndex = cat.clues.findIndex((c) => c.id === clueId);
  if (clueIndex === -1) return;

  activeClue = cat.clues.splice(clueIndex, 1)[0];
  activeClueMode = 1;

  $(event.target).addClass("viewed").off("click");
  $("#active-clue").html(activeClue.question);

  if (cat.clues.length === 0) {
    categories = categories.filter((c) => c.id !== catId);
  }
}

$("#active-clue").on("click", handleClickOfActiveClue);

function handleClickOfActiveClue() {
  if (activeClueMode === 0) return;

  if (activeClueMode === 1) {
    activeClueMode = 2;
    $("#active-clue").html(activeClue.answer);
  } else if (activeClueMode === 2) {
    activeClueMode = 0;
    $("#active-clue").html("");

    if (categories.length === 0) {
      $("#play").text("Restart the Game!");
      $("#active-clue").html("The End!");
    }
  }
}
