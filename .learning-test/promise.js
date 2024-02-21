function walkDog() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const dogWalked = true;
      if (dogWalked) {
        resolve("Can walk dog");
      } else {
        reject("Can't walk dog");
      }
    }, 2000);
  })
}

function walkCat() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const catWalked = true;
      if (catWalked) {
        resolve("Can walk cat");
      } else {
        reject("Can't walk cat");
      }
    }, 2000);
  })
}

function walk() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const walked = true;
      if (walked) {
        resolve("Can walk");
      } else {
        reject("Can't walk");
      }
    }, 2000);
  })
}

walkDog().then((value) => {
  console.log(value);
  return walkCat();
}).then((value) => {
  console.log(value);
  return walk();
}).then((value) => {
  console.log(value);
});

// async function test() {
//   const walkDogResult = await walkDog();
//   console.log(walkDogResult)
//   const walkCatResult = await walkCat();
//   console.log(walkCatResult)
//   const walkResult = await walk();
//   console.log(walkResult)
// }
// test()
