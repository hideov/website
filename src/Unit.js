// Inherit from Obj
Unit = function () {
  Obj.apply(this, arguments);
}
Unit.prototype = Object.create(Obj.prototype);
Unit.prototype.constructor = Unit;

// Override init
Unit.prototype.init = function (x, y, species) {
  this.destination = { 'x': undefined, 'y': undefined };
  this.findingPath = false;
  var res = Obj.prototype.init.apply(this, arguments);
  this.obj.frame = 4; // start still, facing south
  return res;
};

Unit.prototype.moveTowards = function (x, y) {
  if (this.findingPath) {
    return;
  }
  this.findingPath = true;

  this.destination.x = Math.floor(x/this.baseGame.map.delta);
  this.destination.y = Math.floor(y/this.baseGame.map.delta);
  // this.obj.rotation = game.physics.arcade.angleToXY(this.obj, x, y);

  // obtain a tilemap
  var tm = this.baseGame.map.getCurrentTilemap();
  // remove yourself from tilemap!!
  tm[this.y][this.x] = 0;
  // set up A*
  var easystar = new EasyStar.js();
  easystar.setGrid(tm);
  easystar.setAcceptableTiles([0]);
  // easystar.enableDiagonals();
  easystar.enableCornerCutting();

  var self = this;
  easystar.findPath(
    self.x,
    self.y,
    self.destination.x,
    self.destination.y,
    function( path ) {
      self.findingPath = false;
      // if no path found, try to get close
      if (path === null || path.length === 0) {
        if (tm[self.destination.y][self.destination.x] === 0) {
          // can't get there
          self.destination = {x: -1, y: -1};
          // remove any contact events?
          // probably need some condition when adding the event
          self.trimEvents("no path"); // TODO test this
          return;
        }
        // move south of the object if you are not there
        // if we find a 0 but still no path, it means we are an island.
        // stop going south and fail!!!!
        if (!(self.destination.x === self.x
            && (self.destination.y === self.y
                || self.destination.y+1 === self.y))) {
          // these below are pixel distances, they come from clicks
          self.moveTowards(x, y + self.baseGame.map.delta);
        }
      } else {
        // update object coordinates
        // WRONG, or at least CONFUSING
        // can we use tweens to do this?
        // self.x = self.destination.x;
        // self.y = self.destination.y;

        // create animation for step by step movement
        var tweens = [];
        //tween.onComplete.add(this.theEnd, this)
        var t = self.baseGame.game.add.tween(self.obj)
          .to({ x: path[0].x*self.baseGame.map.delta,
                y: path[0].y*self.baseGame.map.delta },
              150,
              "Linear");
        t.onComplete.add(self._createFrameUpdate(path[0].x, path[0].y),self);
        t.onComplete.add(self._createPositionUpdate(path[0].x, path[0].y), self);
        tweens.push(t);

        for (var j = 1; j < path.length; j++) {
          t = self.baseGame.game.add.tween(self.obj)
            .to({ x: path[j].x*self.baseGame.map.delta,
                  y: path[j].y*self.baseGame.map.delta },
                150,
                "Linear");
          t.onComplete.add(self._createFrameUpdate(path[j].x, path[j].y),self);
          t.onComplete.add(self._createPositionUpdate(path[j].x, path[j].y), self);
          tweens.push(t);
          tweens[j-1].chain(tweens[j]);
        }
        tweens[0].start();
      }
    });
  easystar.calculate();
};

Unit.prototype.coordinate = function () {
  if (this.x === this.destination.x && this.y === this.destination.y) {
    return true;
  }
  return false;
}

Unit.prototype._createPositionUpdate = function (x, y) {
  var self = this;
  return function () {
    self.x = x;
    self.y = y;
  };
}

Unit.prototype._createFrameUpdate = function (x, y) {
  var self = this;
  return function () {
    // figure out direction first, previous frame later
    // RELIES ON MOVING ONLY IN 4 DIRECTIONS and 3 FRAMES per direction
    var S = 0;
    var W = 3;
    var E = 6;
    var N = 9;
    if (y > self.y) {
      // S
      if (self.obj.frame >= S && self.obj.frame < S+3) {
        self.obj.frame = (self.obj.frame + 1) % 3;
      } else {
        self.obj.frame = S;
      }
    }
    if (x < self.x) {
      // W
      if (self.obj.frame >= W && self.obj.frame < W+3) {
        self.obj.frame = (self.obj.frame + 1) % 3;
      } else {
        self.obj.frame = W;
      }
    }
    if (x > self.x) {
      // E
      if (self.obj.frame >= E && self.obj.frame < E+3) {
        self.obj.frame = (self.obj.frame + 1) % 3;
      } else {
        self.obj.frame = E;
      }
    }
    if (y < self.y) {
      // N
      if (self.obj.frame >= N && self.obj.frame < N+3) {
        self.obj.frame = (self.obj.frame + 1) % 3;
      } else {
        self.obj.frame = N;
      }
    }
    console.log(self.obj.frame)
  };
}
