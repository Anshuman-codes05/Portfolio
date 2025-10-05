   // Sparkles animation
   const canvas = document.getElementById('sparkles');
   const ctx = canvas.getContext('2d');
   canvas.width = window.innerWidth;
   canvas.height = window.innerHeight;

   const sparkles = [];
   for(let i=0;i<80;i++){
     sparkles.push({
       x: Math.random()*canvas.width,
       y: Math.random()*canvas.height,
       r: Math.random()*1.5+0.5,
       speedX: (Math.random()-0.5)*0.2,
       speedY: (Math.random()-0.5)*0.2,
       alpha: Math.random()*0.5+0.3
     });
   }

   function animate(){
     ctx.clearRect(0,0,canvas.width,canvas.height);
     sparkles.forEach(s=>{
       s.x += s.speedX;
       s.y += s.speedY;
       if(s.x<0)s.x=canvas.width;
       if(s.x>canvas.width)s.x=0;
       if(s.y<0)s.y=canvas.height;
       if(s.y>canvas.height)s.y=0;
       ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
       ctx.beginPath();
       ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
       ctx.fill();
     });
     requestAnimationFrame(animate);
   }
   animate();

   // Smooth scroll offset to account for fixed nav + active link state
   const header = document.querySelector('header.navbar');
   const navLinks = Array.from(document.querySelectorAll('header.navbar nav a'));
   const revealEls = Array.from(document.querySelectorAll('.reveal'));

   function getHeaderHeight(){
     return header ? header.getBoundingClientRect().height : 0;
   }

   // Scroll with offset when clicking nav links
   navLinks.forEach(link => {
     link.addEventListener('click', (e) => {
       const href = link.getAttribute('href');
       if(href && href.startsWith('#')){
         e.preventDefault();
         const target = document.querySelector(href);
         if(target){
           const top = target.getBoundingClientRect().top + window.scrollY - (getHeaderHeight() - 1);
           window.scrollTo({ top, behavior: 'smooth' });
         }
       }
     });
   });

   // Highlight active link while scrolling
   const sections = Array.from(document.querySelectorAll('section[id]'));
   function updateActiveLink(){
     const offset = getHeaderHeight() + 20;
     const scrollPos = window.scrollY + offset;
     let currentId = 'hero';
     for(const sec of sections){
       const top = sec.offsetTop;
       if(scrollPos >= top){ currentId = sec.id; }
     }
     navLinks.forEach(a => {
       const isActive = a.getAttribute('href') === `#${currentId}`;
       a.classList.toggle('active', isActive);
     });
   }
   updateActiveLink();
   window.addEventListener('scroll', updateActiveLink, { passive: true });

   // Reveal on scroll
   const io = new IntersectionObserver((entries) => {
     entries.forEach(entry => {
       if(entry.isIntersecting){
         entry.target.classList.add('revealed');
         io.unobserve(entry.target);
       }
     });
   }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

   revealEls.forEach(el => io.observe(el));

   // Tilt effect
   const tiltEls = Array.from(document.querySelectorAll('.tilt'));
   const MAX_TILT_DEFAULT = 10;
   tiltEls.forEach(el => {
     const maxTilt = parseFloat(getComputedStyle(el).getPropertyValue('--tiltMax')) || MAX_TILT_DEFAULT;
     const handleMove = (e) => {
       const rect = el.getBoundingClientRect();
       const x = e.clientX - rect.left; const y = e.clientY - rect.top;
       const px = (x / rect.width - 0.5) * 2;
       const py = (y / rect.height - 0.5) * 2;
       const rx = (-py * maxTilt).toFixed(2);
       const ry = (px * maxTilt).toFixed(2);
       el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
       el.style.setProperty('--mx', `${x}px`);
       el.style.setProperty('--my', `${y}px`);
       el.classList.add('is-tilting');
     };
     const reset = () => {
       el.style.transform = 'rotateX(0deg) rotateY(0deg)';
       el.classList.remove('is-tilting');
     };
     el.addEventListener('mousemove', handleMove);
     el.addEventListener('mouseleave', reset);
     el.addEventListener('blur', reset);
   });

   window.addEventListener('resize',()=>{
     canvas.width = window.innerWidth;
     canvas.height = window.innerHeight;
     updateActiveLink();
   });

   // Modal functionality
   function openModal() {
     document.getElementById('projectModal').style.display = 'block';
   }

   function closeModal() {
     document.getElementById('projectModal').style.display = 'none';
   }

   // Close modal when clicking outside of it
   window.onclick = function(event) {
     const modal = document.getElementById('projectModal');
     if (event.target == modal) {
       closeModal();
     }
   }

   // Close modal with Escape key
   document.addEventListener('keydown', function(event) {
     if (event.key === 'Escape') {
       closeModal();
       closeImageModal();
     }
   });

   // =========== Anonymous Games Logic ==========
   function toggleGame(id){
     const el = document.getElementById(id);
     if(!el) return;
     const nowVisible = el.style.display !== 'block';
     document.querySelectorAll('#anonymous .game-area').forEach(x=> x.style.display='none');
     el.style.display = nowVisible ? 'block' : 'none';
     if(nowVisible){
       if(id==='snakeArea') startSnake();
       if(id==='typingArea') initTyping();
       if(id==='memoryArea') initMemory();
     }
   }

   // ---- Snake ----
   let snakeTimer, snake, dir, food, score;
   function startSnake(){
     const c = document.getElementById('snake'); if(!c) return; const ctx = c.getContext('2d');
     const w = c.width, h = c.height, size = 16, cols = Math.floor(w/size), rows = Math.floor(h/size);
     snake = [{x:5,y:5}], dir = {x:1,y:0}; food = spawn(); score = 0; updateSnakeStats();
     clearInterval(snakeTimer);
     snakeTimer = setInterval(()=>{
       const head = {x: (snake[0].x+dir.x+cols)%cols, y:(snake[0].y+dir.y+rows)%rows};
       if(snake.some((s,i)=> i&& s.x===head.x && s.y===head.y)){
         snake = [{x:5,y:5}]; dir={x:1,y:0}; score = 0; food = spawn();
       } else {
         snake.unshift(head);
         if(head.x===food.x && head.y===food.y){ score++; food = spawn(); updateSnakeStats(); } else { snake.pop(); }
       }
       ctx.fillStyle = '#0a0a12'; ctx.fillRect(0,0,w,h);
       ctx.fillStyle = '#ffd86e'; ctx.fillRect(food.x*size, food.y*size, size, size);
       ctx.fillStyle = '#6efff0'; snake.forEach(s=> ctx.fillRect(s.x*size, s.y*size, size-1, size-1));
     }, 100);
     window.onkeydown = (e)=>{
       if(e.key==='ArrowUp'){ if(dir.y!==1) dir={x:0,y:-1}; e.preventDefault(); }
       else if(e.key==='ArrowDown'){ if(dir.y!==-1) dir={x:0,y:1}; e.preventDefault(); }
       else if(e.key==='ArrowLeft'){ if(dir.x!==1) dir={x:-1,y:0}; e.preventDefault(); }
       else if(e.key==='ArrowRight'){ if(dir.x!==-1) dir={x:1,y:0}; e.preventDefault(); }
     }
       window.changeDirection = (direction) => {
       if(direction==='up' && dir.y!==1) dir={x:0,y:-1};
       else if(direction==='down' && dir.y!==-1) dir={x:0,y:1};
       else if(direction==='left' && dir.x!==1) dir={x:-1,y:0};
       else if(direction==='right' && dir.x!==-1) dir={x:1,y:0};
     }
     function spawn(){ return { x: Math.floor(Math.random()*cols), y: Math.floor(Math.random()*rows) }; }
     function updateSnakeStats(){ const el = document.getElementById('snakeStats'); if(el) el.textContent = `Score: ${score}`; }
   }

   // ---- Typing Speed ----
   const techWords = ['python','react','node','tailwind','linux','mysql','git','docker','numpy','api','class','function','promise','hooks','context'];
   let targetText='', startTime=0, typed=0, errors=0;
   function initTyping(){
     const t = document.getElementById('typingTarget'); const input = document.getElementById('typingInput'); const stats = document.getElementById('typingStats');
     if(!t||!input||!stats) return;
     targetText = Array.from({length: 10}, ()=> techWords[Math.floor(Math.random()*techWords.length)]).join(' ');
     t.textContent = targetText; input.value=''; startTime=0; typed=0; errors=0; input.focus();
     input.oninput = ()=>{
       if(!startTime) startTime = Date.now();
       const val = input.value; typed = val.length;
       const compareLen = Math.min(val.length, targetText.length);
       let err=0; for(let i=0;i<compareLen;i++){ if(val[i]!==targetText[i]) err++; }
       errors = err + Math.max(0, val.length - targetText.length);
       const mins = (Date.now()-startTime)/60000 || 1e-6; const wpm = Math.max(0, Math.round((typed/5)/mins));
       const acc = Math.max(0, Math.round(100*((typed-errors)/(typed||1))));
       stats.textContent = `WPM: ${wpm} • Accuracy: ${acc}%`;
       if(val === targetText){ t.textContent = 'Great! Press Enter to restart'; }
     }
     input.onkeydown = (e)=>{ if(e.key==='Enter'){ initTyping(); } }
   }

   // ---- Memory Flip ----
   const skillSet = ['Py','JS','DB','Rx','Li','Re','Nd','Tw'];
   let first=null, second=null, locked=false, pairs=0, moves=0;
   function initMemory(){
     const grid = document.getElementById('memoryGrid'); const stats = document.getElementById('memoryStats');
     if(!grid||!stats) return; grid.innerHTML=''; first=second=null; locked=false; pairs=0; moves=0;
     const deck = [...skillSet, ...skillSet].sort(()=> Math.random()-0.5);
     deck.forEach((label)=>{
       const d = document.createElement('div'); d.className='card'; d.dataset.label = label; d.textContent='?';
       d.onclick = ()=>{
         if(locked || d.classList.contains('face')) return; d.classList.add('face'); d.textContent = label;
         if(!first){ first=d; }
         else if(first && !second){
           second=d; moves++;
           if(first.dataset.label===second.dataset.label){ pairs++; first=null; second=null; }
           else { locked=true; setTimeout(()=>{ first.classList.remove('face'); first.textContent='?'; second.classList.remove('face'); second.textContent='?'; first=null; second=null; locked=false; }, 600); }
           stats.textContent = `Pairs: ${pairs}/${skillSet.length} • Moves: ${moves}`;
         }
       };
       grid.appendChild(d);
     });
     stats.textContent = `Pairs: 0/${skillSet.length} • Moves: 0`;
   }

   // Image modal functionality
   function openImageModal(imageSrc) {
     console.log('Opening image modal with:', imageSrc);
     document.getElementById('expandedImage').src = imageSrc;
     document.getElementById('imageModal').style.display = 'block';
   }

   function closeImageModal() {
     console.log('Closing image modal');
     document.getElementById('imageModal').style.display = 'none';
   }

   // Test function to check if modal works
   function testImageModal() {
     console.log('Testing image modal...');
     openImageModal('https://raw.githubusercontent.com/Anshuman-codes05/Portfolio/4f66db9e48b3844ee3c1a75d035173161bdba87f/Screenshot%202025-10-05%20130410.png');
   }

   // Close image modal when clicking outside of it
   window.onclick = function(event) {
     const modal = document.getElementById('projectModal');
     const imageModal = document.getElementById('imageModal');
     if (event.target == modal) {
       closeModal();
     }
     if (event.target == imageModal) {
       closeImageModal();
     }

   }

   // Hamburger menu toggle
   const hamburger = document.getElementById('hamburger');
   const navMenu = document.getElementById('nav-menu');
   if(hamburger && navMenu){
     hamburger.addEventListener('click', () => {
       navMenu.classList.toggle('active');
       hamburger.classList.toggle('active');
     });

     // Close menu when link is clicked
     navMenu.querySelectorAll('a').forEach(link => {
       link.addEventListener('click', () => {
         navMenu.classList.remove('active');
         hamburger.classList.remove('active');
       });
     });
   }








