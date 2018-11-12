// CUSTOM BEHAVIOUR
Physics.behavior('demo-mouse-events', function( parent ){ return {
  init: function( options ){
    var self = this;

    this.mousePos = Physics.vector();
    this.mousePosOld = Physics.vector();
    this.offset = Physics.vector();

    var offset = options.el.getBoundingClientRect();

    this.el = options.el;

    this.el.addEventListener('mousedown', function(e){
      self.mousePos.set(e.pageX - offset.left, e.pageY - offset.top);

      var body = self._world.findOne({ $at: self.mousePos }) ;

      if ( body ){
        // we're trying to grab a body

        // fix the body in place
        body.fixed = true;
        // remember the currently grabbed body
        self.body = body;
        // remember the mouse offset
        self.offset.clone( self.mousePos ).vsub( body.state.pos );
        return;
      }

      self.mouseDown = true;
    });

    this.el.addEventListener('mousemove', function(e){
      self.mousePosOld.clone( self.mousePos );
      self.mousePos.set(e.pageX - offset.left, e.pageY - offset.top);
    });

    this.el.addEventListener('mouseup', function(e){
      self.mousePosOld.clone( self.mousePos );
      self.mousePos.set(e.pageX - offset.left, e.pageY - offset.top);

      // release the body
      if (self.body){
        self.body.fixed = false;
        self.body = false;
      }
      self.mouseDown = false;
    });
  },

  connect: function( world ){
    // subscribe the .behave() method to the position integration step
    world.on('integrate:positions', this.behave, this);
  },

  disconnect: function( world ){
    // unsubscribe when disconnected
    world.off('integrate:positions', this.behave);
  },

  behave: function( data ){

    if ( this.body ){
      // if we have a body, we need to move it the the new mouse position.
      // we'll also track the velocity of the mouse movement so that when it's released
      // the body can be "thrown"
      this.body.state.pos.clone( this.mousePos )
        .vsub( this.offset );
      this.body.state.vel.clone( this.body.state.pos )
        .vsub( this.mousePosOld )
        .vadd( this.offset )
        .mult( 1 / 30 );
      this.body.state.vel.clamp( { x: -1, y: -1 }, { x: 1, y: 1 } );
      return;
    }

    if ( !this.mouseDown ) return;

    // if we don't have a body, then just accelerate
    // all bodies towards the current mouse position

    var bodies = data.bodies,
        // use a scratchpad to speed up calculations
        scratch = Physics.scratchpad(),
        v = scratch.vector(),
        body;

    // for (var i = 0, l = bodies.length; i < l; ++i) {
    //   body = bodies[ i ];
    //
    //   // simple linear acceleration law towards the mouse position
    //   v.clone(this.mousePos)
    //     .vsub( body.state.pos )
    //     .normalize()
    //     .mult( 0.001 );
    //
    //   body.accelerate( v );
    // }

    scratch.done();
  }
}});


// CUSTOM SVG RENDERER
Physics.renderer('svg', function( proto ){ return {
  /**
   * Initialization
   * @param  {Object} options Config options passed by initializer
   * @return {void}
   */
  init: function( options ){
    // call proto init
    proto.init.call(this, options);

    var containerDims = options.el.getBoundingClientRect();
    this.svgCanvas = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svgCanvas.setAttribute(
      'style',
      `width:${containerDims.width};
       height: ${containerDims.height};`
    );

    options.el.appendChild(this.svgCanvas);
  },

  /**
   * Create a dom element for the specified geometry
   * @param  {Geometry} geometry The body's geometry
   * @return {HTMLElement}          The element
   */
  createView: function( geometry){
    var aabb = geometry.aabb();
    var rect = document.createElementNS('http://www.w3.org/2000/svg', "rect");

    rect.setAttribute('width', 40 + 'px');
    rect.setAttribute('height', 40 + 'px');
    rect.setAttribute('fill', '#87ceeb');

    this.svgCanvas.appendChild(rect);
    return rect;
  },

  /**
   * Connect to world. Automatically called when added to world by the setWorld method
   * @param  {Object} world The world to connect to
   * @return {void}
   */
  connect: function( world ){
    world.on( 'add:body', this.attach, this );
    world.on( 'remove:body', this.detach, this );
  },

  /**
   * Disconnect from world
   * @param  {Object} world The world to disconnect from
   * @return {void}
   */
  disconnect: function( world ){
    world.off( 'add:body', this.attach );
    world.off( 'remove:body', this.detach );
  },

  /**
   * Detach a node from the DOM
   * @param  {HTMLElement|Object} data DOM node or event data (data.body)
   * @return {self}
   */
  detach: function( data ){
    // interpred data as either dom node or event data
    var el = (data.nodeType && data) || (data.body && data.body.view),
        par = el && el.parentNode;

    // remove view from dom
    if (el && par)
      par.removeChild( el );
    return this;
  },

  /**
   * Attach a node to the viewport
   * @param  {HTMLElement|Object} data DOM node or event data (data.body)
   * @return {self}
   */
  attach: function( data ){
    // interpret data as either dom node or event data
    var el = (data.nodeType && data) || (data.body && data.body.view);

    if (el){
      // attach to viewport
      this.svgCanvas.appendChild(el);
    }

    return this;
  },

  /**
   * Draw the meta data
   * @param  {Object} meta The meta data
   * @return {void}
   */
  drawMeta: function( meta ){},

  drawBody: function( body, view ) {
    var pos = body.state.pos;
    view.setAttribute('x', pos.get(0));
    view.setAttribute('y', pos.get(1));
  },
}});



// PREPARE AND INITIALISE WORLD
var containerDims = {
  w: 800,
  h: 400,
};

var svgContainer = document.querySelector('.js-svg-canvas-container');

svgContainer.setAttribute(
  'style',
  `border: 1px solid skyblue;
   width: ${containerDims.w}px;
   height: ${containerDims.h}px;
  `
);

document.body.appendChild(svgContainer);

// world declaration
var world = Physics();

// creation of the renderer which will draw the world
var renderer = Physics.renderer("svg",{
  el: svgContainer,
  width: containerDims.w,
  height: containerDims.h,
  meta: false,
});

// adding the renderer to the world
world.add(renderer);

// what happens at every iteration step? We render (show the world)
world.on("step", function(){ world.render(); });

// this is the default gravity
var gravity = Physics.behavior("constant-acceleration",{
  acc: {
    x: 0,
    y: 0.0004,
  },
});

// adding gravity to the world
world.add(gravity);

world.add(Physics.behavior('demo-mouse-events', { el: svgContainer }));

// adding collision detection with canvas edges
world.add(Physics.behavior("edge-collision-detection", {
  aabb: Physics.aabb(0, 0, containerDims.w, containerDims.h),
  restitution: 0
}));

// bodies will react to forces such as gravity
world.add(Physics.behavior("body-impulse-response"));

// enabling collision detection among bodies
world.add(Physics.behavior("body-collision-detection"));
world.add(Physics.behavior('body-impulse-response'));
world.add(Physics.behavior('verlet-constraints'));
world.add(Physics.behavior("sweep-prune"));

svgContainer.addEventListener('click', function(e){
  // checking canvas coordinates for the mouse click
  var offset = this.getBoundingClientRect();
  var px = e.pageX - offset.left;
  var py = e.pageY - offset.top;

  // this is the way physicsjs handles 2d vectors, similar at Box2D's b2Vec
  var mousePos = Physics.vector();
  mousePos.set(px,py);

  // finding a body under mouse position
  var body = world.findOne({
    $at: mousePos
  })

  // there isn't any body under mouse position, going to create a new box
  if(!body){
    var bod = Physics.body('rectangle',{
      x: px,
      y: py,
      width: 40,
      height: 40,
    }, {
      color:'#FF0000',
    });

    world.add(bod);
  } else {
    // there is a body under mouse position, let's remove it
    world.removeBody(body);
  }
});

// handling timestep
Physics.util.ticker.on(function(time,dt){
  world.step(time);
});
Physics.util.ticker.start();
