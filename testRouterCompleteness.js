const fs = require("fs");

let views  = fs.readFileSync('./js/router/Views.ts', {encoding:'ascii'});
let router = fs.readFileSync('./js/router/Routes.tsx', {encoding:'ascii'});

let complete = true;
let viewRegex = /(\S*):/gm;
let routerRegex = /Views.(\w*)/gm
let viewMatches = views.match(viewRegex);
let routerMatches = router.match(routerRegex);


let viewArray = [];
let routerArray = [];

for ( let i = 0; i < viewMatches.length; i++) {
  let match = viewMatches[i];
  let resultArray = [];
  while ((resultArray = viewRegex.exec(match)) !== null) {
    if (resultArray[1]) {
      viewArray.push(resultArray[1])
    }
  }
}

for ( let i = 0; i < routerMatches.length; i++) {
  let match = routerMatches[i];
  let resultArray = [];
  while ((resultArray = routerRegex.exec(match)) !== null) {
    if (resultArray[1]) {
      routerArray.push(resultArray[1])
    }
  }
}

viewArray.forEach((view) => {
  if (routerArray.indexOf(view) === -1) {
    console.log("View is not transferred yet: ", view);
    complete = true;
  }
})


routerArray.forEach((view) => {
  if (viewArray.indexOf(view) === -1) {
    console.log("View does not exist: ", view);
    complete = true;
  }
})

if (complete) {
  console.log("All done!")
}




