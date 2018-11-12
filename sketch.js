/* This is the start of a simple p5.js sketch using p5-matter.
 Use this as a template for creating your own sketches! */

var blocks = [];
var floor;
var blockSizeOffset = 20

function setup() {
  // put setup code here.
  createCanvas(windowWidth, windowHeight - 10);


  floor = matter.makeBarrier(width / 2, height, width, 50);
}

function draw() {
  // put the drawing code here
  background(255);

  fill(255);
  stroke(51);

  floor.show();

  if (frameCount % 45 === 0) {
    let block = matter.makeBlock(width / 2 + random(-20, 20), 0, 40 + random(-blockSizeOffset, blockSizeOffset), 40 + random(-blockSizeOffset, blockSizeOffset))
    blocks.push(block)
    console.log(blocks.length);
  }

  for (let i = 0; i < blocks.length ; i++) {
    if (isOutofBounds(blocks[i].body.position)) {
      blocks.splice(i, 1)
    }
    blocks[i].show()
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function isOutofBounds(pos) {
  if (pos.x < -20 || pos.x > windowWidth + 20 || pos.y > windowHeight + 20) return true;
  else return false
}
