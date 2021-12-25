
//Source: https://darmstadt.freifunk.net/

function initEC(containerId) {

  var width, height, largeHeader, canvas, container, ctx, points, target, mousepoint, animateHeader = true, point_count, max_distance = 0;

  var canvas_opacity = 0; // Starting opacity of canvas

  var target_point_count = 20; // Point count in case target_point_rate < 0
  var target_point_rate = 0.000039; // Amount of points = height * width * target_point_rate
  var min_point_speed = -1; // Minimum movement speed of points
  var max_point_speed = 1; // Maximum movement speed of points
  var min_point_radius = 3; // Minimum radius of points
  var max_point_radius = 8; // Maximum radius of points
  var point_deadzone = 90; // Zone where out of view points get removed

  var max_distance_factor = 0.1; //max_distance = getDistance(0, 0, width, height) * max_distance_factor

  var quality_mode = false;
  var quality_mode_activation_zone = 25; // area in x, y direction from bottom left corner to acrivate quality mode
  var quality_mode_steps = {required: 4, steps: 0, lastattempt: 0};

  // Main
  if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    console.log('start eyecandy');
    initHeader();
    calculatePoints();
    animate();
    addListeners();
    setTimeout(resize, 400)
  }

  function initHeader() {
    container = document.getElementById(containerId);
    canvas = document.createElement('canvas');
    container.appendChild(canvas);

    initValues();

    ctx = canvas.getContext('2d');
  }

  function initValues() {
    width = container.offsetWidth;
    height = container.offsetHeight;
    target = {x: width / 2, y: height / 2};

    canvas.width = width;
    canvas.height = height;

    point_count = target_point_rate < 0 ? target_point_count : width * height * target_point_rate;
    max_distance = getDistance(0, 0, width, height) * max_distance_factor;
  }

  function toggleQualityMode() {
    if (quality_mode) {
      quality_mode = false;
    } else {
      quality_mode = true;
    }
  }

  //Points
  function calculatePoints() {
    // create points
    points = [];
    for (var x = 0; x < point_count; x++) {
      var px = getRandomRange(0, width);
      var py = getRandomRange(0, height);
      spawnPoint(px, py);
    }

    // Add mousepoint
    mousepoint = {x: -999999, y: -999999, sy: 0, sx: 0, active: 0, mousepoint: true};
    mousepoint.circle = new Circle(mousepoint, 0, 'rgba(51, 141, 244, 0.8)');
    points.push(mousepoint);
  }

  function spawnPoint(px, py) {
    var sx = 0;
    var sy = 0;
    while ((sx > -0.01 && sx < 0.01) || (sy > -0.01 && sy < 0.01)) {
      sx = getRandomRange(min_point_speed * 100, max_point_speed * 100) / 100;
      sy = getRandomRange(min_point_speed * 100, max_point_speed * 100) / 100;
    }
    var p = {x: px, y: py, sy: sy, sx: sx, active: 0, mousepoint: false};
    p.circle = new Circle(p, getRandomRange(min_point_radius, max_point_radius), 'rgba(51, 141, 244, 0.8)');
    p.circle.active = 0.7;
    points.push(p);
  }

  function removePoint(index) {
    output = [];
    for (var i = 0; i < points.length; i++) {
      if (i != index) {
        output.push(points[i]);
      }
    }
    points = output;
  }

  function resetPosition() {
    for (var i = 0; i < points.length; i++) {
      var radius = points[i].circle.radius;
      var del = false;
      if ((points[i].y < 0 - point_deadzone || points[i].y > height + point_deadzone) && !points[i].mousepoint) {
        if (points.length > point_count + 1) {
          del = true;
        }
        points[i].sy = points[i].sy * (-1);
      }
      if ((points[i].x < 0 - point_deadzone || points[i].x > width + point_deadzone) && !points[i].mousepoint) {
        if (points.length > point_count + 1) {
          del = true;
        }
        points[i].sx = points[i].sx * (-1);
      }
      if (del) {
        removePoint(i);
      }
    }
  }

  function findClosest(ps) {
    var p1 = ps;
    var closest = [];
    for (var j = 0; j < points.length; j++) {
      var p2 = points[j];
      if (!(p1 == p2)) {
        var point_distance = Math.abs(getDistance(p1.x, p1.y, p2.x, p2.y))
        if (point_distance <= max_distance) {
          closest.push({target: p2, opacity: calculateOpacity(point_distance), distance: point_distance});
        }
      }
    }
    p1.closest = closest;
  }

  function shiftPoint(p) {
    p.x = p.x + p.sx;
    p.y = p.y + p.sy;
  }

  // Event handling
  function addListeners() {
    if (!('ontouchstart' in window)) {
      window.addEventListener('mousemove', mouseMove);
      window.addEventListener('click', mouseClick);
    }
    window.addEventListener('scroll', scrollCheck);
    window.addEventListener('resize', resize);
  }

  function mouseMove(e) {
    var posx = posy = 0;
    if (e.pageX || e.pageY) {
      posx = e.pageX;
      posy = e.pageY;
    }
    else if (e.clientX || e.clientY) {
      posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
      posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
    target.x = posx;
    target.y = posy;
    mousepoint.x = target.x;
    mousepoint.y = target.y;
  }

  function mouseClick(e) {
    if (target.x <= width && target.x > 0 && target.y <= height && target.y > 0) {
      spawnPoint(target.x, target.y);
    }
    if (target.x <= quality_mode_activation_zone && target.y > height - quality_mode_activation_zone) {
      console.log("ppp");
      if (quality_mode_steps.lastattempt > currentTimestamp() - 2) {
        quality_mode_steps.steps++;
        if (quality_mode_steps.steps >= quality_mode_steps.required) {
          toggleQualityMode();
          quality_mode_steps.steps = 0;
        }
      } else {
        quality_mode_steps.steps = 1;
      }
      quality_mode_steps.lastattempt = currentTimestamp();
    }
  }

  function scrollCheck() {
    if (document.body.scrollTop > height) animateHeader = false;
    else animateHeader = true;
  }

  function resize() {
    if (width != container.offsetWidth || height != container.offsetHeight) {
      initValues();
      calculatePoints();
    }
  }

  function animate() {
    if (animateHeader) {
      ctx.clearRect(0, 0, width, height);
      resetPosition();
      for (var i in points) {
        shiftPoint(points[i]);
        findClosest(points[i]);
        drawLines(points[i]);
        points[i].circle.draw();
      }
      if (canvas_opacity < 1) {
        canvas_opacity = canvas_opacity + 0.01;
        canvas.style.opacity = canvas_opacity;
      }
    }
    requestAnimationFrame(animate);
  }

  // Canvas manipulation
  function drawLines(p) {
    for (var i in p.closest) {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.closest[i].target.x, p.closest[i].target.y);
      if (quality_mode) {
        var distance = 512 * (p.closest[i].distance / max_distance);
        var r = Math.round(distance < 256 ? distance : 255);
        var g = Math.round(distance < 256 ? 255 : 255 - (distance - 255));
        ctx.strokeStyle = 'rgba(' + r + ', ' + g + ', 0, ' + p.closest[i].opacity + ')';
      } else {
        ctx.strokeStyle = 'rgba(51, 141, 244,' + p.closest[i].opacity + ')';
      }
      ctx.stroke();
    }
  }

  function Circle(pos, rad, color) {
    var _this = this;

    // constructor
    (function () {
      _this.pos = pos || null;
      _this.radius = rad || null;
      _this.color = color || null;
    })();

    this.draw = function () {
      if (!_this.active) return;
      ctx.beginPath();
      ctx.arc(_this.pos.x, _this.pos.y, _this.radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'rgba(51, 141, 244,' + _this.active + ')';
      ctx.fill();
    };
  }

  // Util
  function getDistance(p1x, p1y, p2x, p2y) {
    return Math.sqrt(Math.pow(p1x - p2x, 2) + Math.pow(p1y - p2y, 2));
  }

  function getRandomRange(minin, maxin) {
    return Math.floor(Math.random() * (maxin - minin + 1) + minin);
  }

  function currentTimestamp(minin, maxin) {
    return Math.floor((new Date).getTime() / 1000);
  }

  function calculateOpacity(point_distance) {
    var suggested_opacity = (max_distance - point_distance) / max_distance;
    return suggested_opacity > 0 ? suggested_opacity : 0;
  }
}
