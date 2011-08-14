// @see http://paulirish.com/2011/requestanimationframe-for-smart-animating/
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       || 
          window.webkitRequestAnimationFrame || 
          window.mozRequestAnimationFrame    || 
          window.oRequestAnimationFrame      || 
          window.msRequestAnimationFrame     || 
          function(/* function */ callback, /* DOMElement */ element){
            window.setTimeout(callback, 1000 / 60);
          };
})();
// set the scene size
WIDTH = window.innerWidth,
    HEIGHT = window.innerHeight;

// set some camera attributes
VIEW_ANGLE = 45,
    ASPECT = WIDTH / HEIGHT,
    NEAR = 0.1,
    FAR = 10000;

texts_objs = [];
old_texts_objs = [];
texts_strings = [];
function updateTexts(){
    $.ajax({
        url:'data.json',
        dataType:'json',
        success:function(data){
            console.warn('new sms data')
            var text_count = texts_objs.length;
            texts_objs.length = 0;
            if(data.numbers.length) {
                for(i=0;i<data.numbers.length;i++) {
                    if(data.numbers[i] !== "14155992671") {
                        var txt = {
                            body:data.body[i],
                            number:data.numbers[i]
                        }
                        if(texts_strings.indexOf(JSON.stringify(txt))<0){
                            texts_objs.push(txt);
                            texts_strings.push(JSON.stringify(txt));
                        }
                    }
                }
            }
            if(texts_objs.length){
                setTimeout("updateTexts()",texts_objs.length * 10000)
                displayTexts(0);
            }else{
                texts_objs = old_texts_objs;
                displayTexts(0);
                setTimeout("updateTexts()",texts_objs.length * 10000)
            }
        }
    })
} 

function displayTexts(text){
    if(sms = text || texts_objs[0]){
        var hex = hex_md5(sms.body);
        console.warn(hex,sms.number,sms.body);
        gui_vars.target_red = parseInt('0x' + hex.substring(0,2))/256;
        gui_vars.target_green = parseInt('0x' + hex.substring(2,4))/256;
        gui_vars.target_blue = parseInt('0x' + hex.substring(4,6))/256;
        gui_vars.size = parseInt('0x' + hex.substring(6,8))/256*400 + 40;
        gui_vars.opacity = parseInt('0x' + hex.substring(8,10))/256/2 + 0.15;
        gui_vars.rotation_speed = (parseInt('0x' + hex.substring(10,12)) - 128)/256/10;
        gui_vars.gravity = (parseInt('0x' + hex.substring(12,14)) - 128)/256/10 + 0.4;

        gui_vars.clear_red = parseInt('0x' + hex.substring(14,16))/256;
        gui_vars.clear_green = parseInt('0x' + hex.substring(16,18))/256;
        gui_vars.clear_blue = parseInt('0x' + hex.substring(18,20))/256;
        if((Math.random() < 0.5) && (gui_vars.clear_red + gui_vars.clear_green + gui_vars.clear_blue < gui_vars.red + gui_vars.green + gui_vars.blue)){
            gui_vars.blend_mode = 'additive';
        }else{
            gui_vars.blend_mode = 'subtract';
        }



        
        $('#message').text('(' + sms.number.substring(1,4) + '): ' + sms.body);
        parseText(sms.body);
        !text && old_texts_objs.push(texts_objs.shift());
        setTimeout("displayTexts()",10000);
    }
}

function parseText(text){
    if(text && text.length){
        body_array = text.split(' ');
        if(body_array && body_array.length){
            for(i=0;i<body_array.length;i++){
                var word = body_array[i].toLowerCase();
                
                // named functions
                if(keywords[word] && typeof keywords[word] == 'object'){
                    keywords[word]();
                    console.warn(word)
                    // return false;
                    var mess = $('#message').text().replace(word,'<span>' +word+ '</span>');
                    console.warn(mess)
                    $('#message').html(mess);
                }
                
                // named hex values
                if(keywords[word] && typeof keywords[word] == 'number'){
                    gui_vars.target_red = ((keywords[word] & 0xff0000) >> 16)/256;
                    gui_vars.target_green = ((keywords[word] & 0x00ff00) >> 8)/256;
                    gui_vars.target_blue = (keywords[word] & 0x0000ff)/256;                        
                    gui_vars.clear_red = 0;
                    gui_vars.clear_green = 0;
                    gui_vars.clear_blue = 0;
                    gui_vars.blend_mode ='additive';
                    console.warn('word', word)
                    // return false;
                    var mess = $('#message').text().replace(word,'<span>' +word+ '</span>');
                    console.warn(mess)
                    $('#message').html(mess);
                }
                // two word named hex vales
                if(body_array[i+1] && keywords[word + ' ' + body_array[i+1]] && typeof keywords[word] == 'number'){
                    var two_word = word + ' ' + body_array[i+1]
                    gui_vars.target_red = ((keywords[two_word] & 0xff0000) >> 16)/256;
                    gui_vars.target_green = ((keywords[two_word] & 0x00ff00) >> 8)/256;
                    gui_vars.target_blue = (keywords[two_word] & 0x0000ff)/256;
                    gui_vars.clear_red = 0;
                    gui_vars.clear_green = 0;
                    gui_vars.clear_blue = 0;
                    gui_vars.blend_mode ='additive';

                    console.warn('two word',two_word)
                    // return false;
                    var mess = $('#message').text().replace(two_word,'<span>' +two_word+ '</span>');
                    console.warn(mess)
                    $('#message').html(mess);

                    
                }

            }
        }
    }
}

function set_up_renderer(){
    // create a WebGL renderer, camera
    // and a scene
    try {
        renderer = new THREE.WebGLRenderer();
        camera = new THREE.Camera(  VIEW_ANGLE,
                                        ASPECT,
                                        NEAR,
                                        FAR  );
        scene = new THREE.Scene();

        // the camera starts at 0,0,0 so pull it back
        camera.position.z = 300;

        // start the renderer - set the clear colour
        // to a full black
        renderer.setClearColorHex(0x000000,0);
        renderer.setSize(WIDTH, HEIGHT);

        // attach the render-supplied DOM element
        $container.append(renderer.domElement);
    }catch(error){
        alert('Sorry, Send to Recieve uses WebGL and your browser isn\'t up to it. Try using Chrome.');
    }
    

}

// create the particle variables
function create_particles(){
    particles = new THREE.Geometry(),
        pMaterial = new THREE.ParticleBasicMaterial({
            color: 0xFFFFFF,
            opacity:gui_vars.opacity,
            size: gui_vars.size,
            map: THREE.ImageUtils.loadTexture(
                "images/particle2.png"
            ),
            blending: THREE.AdditiveBlending,
            transparent: true
        });
}

function generateParticleScene(){

    // now create the individual particles
    for(var p = 0; p < gui_vars.number; p++) {

        // create a particle with random
        // position values, -250 -> 250
        var pX = Math.random() * 500 - 250,
            pY = Math.random() * 500 - 250,
            pZ = Math.random() * 500 - 250,
            particle = new THREE.Vertex(
                new THREE.Vector3(pX, pY, pZ)
            );
        // create a velocity vector
        particle.velocity = new THREE.Vector3(
            0,              // x
            -Math.random(), // y
            0);             // z

        // add it to the geometry
        particles.vertices.push(particle);
    }

    // create the particle system
    particleSystem = new THREE.ParticleSystem(
        particles,
        pMaterial);

    particleSystem.sortParticles = true;

    if(scene && scene.children.length){
        for(i=0;i<scene.length;i++){
            scene.removeChild(scene.children[i]);
        }
    }

    // add it to the scene
    scene.addChild(particleSystem);

}


function cDrift(oldc,newc,speed){
    if(oldc.r != newc.r || oldc.g != newc.g ||  oldc.b != newc.b){
        var more_r = oldc.r < newc.r,
            more_g = oldc.g < newc.g,
            more_b = oldc.b < newc.b;

        more_r && (oldc.r += speed) || (oldc.r -= speed);
        more_r && (oldc.r >= newc.r) && (oldc.r = newc.r);
        more_g && (oldc.g += speed) || (oldc.g -= speed);
        more_g && (oldc.g >= newc.g) && (oldc.g = newc.g);
        more_b && (oldc.b += speed) || (oldc.b -= speed);
        more_b && (oldc.b >= newc.b) && (oldc.b = newc.b);
        
        gui_vars.red = oldc.r;
        gui_vars.green = oldc.g;
        gui_vars.blue = oldc.b;
        
        return oldc;
    }else{
        return newc;
    }
}

// animation loop
function update() {
    
    // add some rotation to the system
    particleSystem.rotation.y += gui_vars.rotation_speed;
    
    var oldc = pMaterial.color;
    var newc = new THREE.Color()
    newc.r = gui_vars.target_red;
    newc.g = gui_vars.target_green;
    newc.b = gui_vars.target_blue;

    pMaterial.color = cDrift(oldc,newc,gui_vars.drift_speed);
    pMaterial.size = gui_vars.size;
    // particle = THREE.ImageUtils.loadTexture("images/particle2.png")
    pMaterial.opacity = gui_vars.opacity;
    
    var cl = new THREE.Color()
    cl.r = gui_vars.clear_red;
    cl.g = gui_vars.clear_green;
    cl.b = gui_vars.clear_blue;

    renderer.setClearColor(cl);

    switch(gui_vars.blend_mode){
        case 'additive': pMaterial.blending = THREE.AdditiveBlending; break;
        case 'subtract': pMaterial.blending = THREE.SubtractiveBlending; break;
    }

    
    // if(scene.children[0])
    // if(pMaterial.map != particle){
    //     pMaterial.map = particle
    // }
    // if(particles.vertices.length !== gui_vars.number){
    //     generateParticleScene()
    // }

    
    var pCount = gui_vars.number;
    while(pCount--) {
        // get the particle
        var particle = particles.vertices[pCount];
        
        // check if we need to reset
        if(particle.position.y < -200) {
            particle.position.y = 200;
            particle.velocity.y = 0;
        }
        
        // update the velocity
        particle.velocity.y -= Math.random() * gui_vars.gravity;
        
        // and the position
        particle.position.addSelf(
            particle.velocity);
    }
    
    // flag to the particle system that we've
    // changed its vertices. This is the
    // dirty little secret.
    particleSystem.geometry.__dirtyVertices = true;
    
    renderer.render(scene, camera);
    
    // set up the next call
    if(playing){
        requestAnimFrame(update);
    }
    
}
