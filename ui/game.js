winheight = (95/100)*($(window).height());
winwidth = $(window).width();
var blocks = [];
var xdim = 6;
var ydim = 11;
// var board = [[],[]];
// var s = 50;
// var r = 20;
var w;
var minboxcount;
if(winheight<winwidth) {
  w = winheight
  minboxcount = ydim;
} else {
  w = winwidth;
  minboxcount = xdim;
}
var s = w/minboxcount;
var r = (80/100)*(s/2)
var bx = 0;
var by = 0;
var animate_required = false;
var animation = [];
var maxvib = (0.8/50)*s;


function setup() {
  var myCanvas = createCanvas(bx+(xdim*s), by+(ydim*s));
  myCanvas.parent("gamecanvas");
  myCanvas.mousePressed(on_mouse_press);
}

function windowResized() {
  location.reload();
}


class Block {
  constructor(x,y,n,pn) {
    this.x = x;
    this.y = y;
    this.n = n;
    this.playerNum = pn;
    if(this.playerNum === thisPlayerNum) {
      this.colour = ' #7289da'
    } else if (this.playerNum === ((thisPlayerNum-1)*(-1))) {
      this.colour = 'red';
    } else {
      this.colour = null;
    }
  
    if(1<this.x && this.x<xdim && 1<this.y && this.y<ydim) {
      this.type = "middle";
      this.maxn = 3; //middle
    } else if ((this.x === 1 && this.y === 1) || (this.x === xdim && this.y === 1) || (this.x===1 && this.y === ydim) || (this.x === xdim && this.y === ydim)) {
      this.type = "corner";
      this.maxn = 1; //corner
    } else {
      this.type = "edge";
      this.maxn = 2; //edge
    }
  }
  
  display() {
    // var s = 50;
    // var r = 20;
    // var bx = 0;
    // var by = 0;
    strokeWeight((1/50)*s)
    stroke('white')
    if(this.type === "middle") {
      fill('#1e2124');
    } else if (this.type === "corner") {
      fill("#36393e")      
    } else if (this.type === "edge") {
      fill("#282b30")
    }
    var sx = bx + (this.x-1)*s;
    var sy = by + (this.y-1)*s;
    square(sx, sy, s);
    // stroke('black')
    noStroke();
    if(this.n > 0) {
      fill(this.colour)
      if(this.n === 1) {
        // ellipse(this.x + 25,this.y + 25,20);
        ellipse(sx + s/2 +this.v, sy + s/2 +this.v, r);
      }
      if(this.n === 2) {
        // ellipse(sx + 20 +this.v,sy + 25 +this.v, r);
        // ellipse(sx + 30 +this.v,sy + 25 +this.v, r);
        ellipse(sx + s/2 - s/10 + this.v, sy + s/2 + this.v, r);
        ellipse(sx + s/2 + s/10 + this.v, sy + s/2 + this.v, r);
      }
      if(this.n === 3) {
        // ellipse(this.x + 25,this.y + 17,20);
        // ellipse(this.x + 15,this.y + 33,20);
        // ellipse(this.x + 35,this.y + 33,20); 
        // ellipse(sx + 25 + this.v,sy + 17 + this.v,20);
        // ellipse(sx + 15 + this.v,sy + 33 + this.v,20);
        // ellipse(sx + 35 + this.v,sy + 33 + this.v,20); 
        ellipse(sx + s/2 + this.v, sy + (17/25)*(s/2) + this.v, r);
        ellipse(sx + s/2 - s/5 + this.v, sy + s/2 + (8/25)*(s/2) + this.v, r);
        ellipse(sx + s/2 + s/5 + this.v, sy + s/2 + (8/25)*(s/2) + this.v, r); 
      }
    }
  }
  
  add(playerNumber) {
    this.playerNum = playerNumber;
    console.log("adding");
    var a = this.x - 1;
    var b = this.y - 1;
    var dest = [];
    if(this.n + 1 >this.maxn) {
      if(this.x-1>=1) {
        dest.push(4)
        // blocks[a-1][b].add()
      }
      if(this.y-1>=1) {
        dest.push(1);
        // blocks[a][b-1].add()
      }
      if(this.y+1<=ydim) {
        dest.push(3);
        // blocks[a][b+1].add()
      }
      if(this.x+1<=xdim) {
        dest.push(2);
        // blocks[a+1][b].add()
      }
      this.n = 0;
      animation = [this.x, this.y, dest, this.colour, this.playerNum];
      animate_required = true;
      this.playerNum = null;
      this.colour = null;
    } else {
      this.n += 1;
    }
  }
  
}



function draw_board(xdim, ydim, p, q) {
  blocks = []
  for(let i=0;i<xdim;i++) {
    blocks.push([]);
    for(let j=0;j<ydim;j++) {
      // console.log(p[i*xdim + j])
      // console.log(i*xdim + j)
      if(p.length === 0) {
        var n = 0;
        var playerNum = null;
      } else {
        var n = int(p[i*ydim + j]);
        var playerNum = q[i*ydim + j];
      }
      block = new Block(i+1, j+1, n, playerNum);
      var vd = block.maxn - block.n;
      block.v = random(-maxvib + vd*(maxvib/3), maxvib - vd*(maxvib/3))
      block.display()
      blocks[i].push(block);
    }
  }
  // console.log(blocks.length)
  // console.log(blocks[0].length)
}


function get_board() {
  var p = [];
  var q = [];
  for(let i=0;i<xdim;i++) {
    for(let j=0;j<ydim;j++) {
      console.log([i,j]);
      p.push(blocks[i][j].n);
      q.push(blocks[i][j].playerNum);
    }
  }
  return [p,q];
}

function on_mouse_press() {
    console.log("clicked");
    if(disabled === false) {
      console.log("not disabled");
      let d = [mouseX, mouseY];
      var a = int((d[0]-bx)/s)+1;
      var b = int((d[1]-by)/s)+1;
      console.log(a);
      console.log(b);  
      block = blocks[a-1][b-1];
      console.log(block.playerNum)
      if(block.playerNum === thisPlayerNum || block.playerNum === null) {
        disabled = true;
        console.log("got in")
        u = [a,b]
        blocks[a-1][b-1].add(thisPlayerNum);
        board = get_board()
        socket.emit('move', {game_code: game_code, userid: userid, block: u, board: board});
        resetTimer()
        // startTimer(45, document.getElementById("timer"));
        document.getElementById("turn").textContent = "OPPONENT'S TURN";
      }
    } 
}

function opponentMove(x, y) {
  blocks[x-1][y-1].add((thisPlayerNum-1)*(-1))
  board = get_board()
  disabled = false;
}

function animate(x, y, dest, colour, d) {
  console.log(d)
  var ex = bx + (x-1)*s + s/2;
  var ey = by + (y-1)*s + s/2;
  fill(colour)
  if(dest.indexOf(2) >= 0) { 
    ellipse(ex + d, ey, r); 
  } 
  if(dest.indexOf(4) >= 0) { 
    ellipse(ex - d, ey, r); 
  }
  if(dest.indexOf(1) >= 0) { 
    ellipse(ex, ey -d , r); 
  }
  if(dest.indexOf(3) >= 0) { 
    ellipse(ex, ey + d, r); 
  }
}

function chain_add(x, y, dest, playerNum) {
  a = x-1;
  b = y-1;
  if(dest.indexOf(2) >= 0) { 
     blocks[a+1][b].add(playerNum);
  } 
  if(dest.indexOf(4) >= 0) { 
    blocks[a-1][b].add(playerNum); 
  }
  if(dest.indexOf(1) >= 0) { 
    blocks[a][b-1].add(playerNum);
  }
  if(dest.indexOf(3) >= 0) { 
    blocks[a][b+1].add(playerNum); 
  }
  board = get_board();
}


var d = 0;
function draw() {
  clear()
  draw_board(xdim, ydim, board[0], board[1])
  if(animate_required===true) {
    d = d += (2/50)*s;
    animate(animation[0], animation[1], animation[2], animation[3], d)
    if(d>=50) {
      d=0;
      animate_required = false;
      chain_add(animation[0], animation[1], animation[2], animation[4])
    }
   }
}




