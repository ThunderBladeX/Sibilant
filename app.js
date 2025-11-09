const SUPABASE_URL='https://egjncvyfcipuyzxuephd.supabase.co';const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnam5jdnlmY2lwdXl6eHVlcGhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjMzNTEsImV4cCI6MjA3Njk5OTM1MX0.xHVQbBxhT758DdMlf26So53h2gqXv49Pjcyr6Lk2ev0';const{createClient}=supabase;const supabaseClient=createClient(SUPABASE_URL,SUPABASE_ANON_KEY);let currentUser=null;let currentStory=null;let allStories=[];let allTags=[];let userLibrary={reading:[],completed:[],saved:[]};document.addEventListener('DOMContentLoaded',async()=>{await checkUser();initializeTheme();setupEventListeners();await loadStories();await loadTags();updateStats()});async function checkUser(){const{data:{session}}=await supabaseClient.auth.getSession();if(session){currentUser=session.user;updateUIForLoggedInUser();await loadUserLibrary()}}
async function login(email,password){const{data,error}=await supabaseClient.auth.signInWithPassword({email,password});if(error){alert('Login failed: '+error.message);return!1}
currentUser=data.user;updateUIForLoggedInUser();await loadUserLibrary();return!0}
async function signup(email,password){const{data,error}=await supabaseClient.auth.signUp({email,password});if(error){alert('Sign up failed: '+error.message);return!1}
alert('Check your email for verification!');return!0}
async function logout(){await supabaseClient.auth.signOut();currentUser=null;userLibrary={reading:[],completed:[],saved:[]};updateUIForLoggedOutUser();showPage('home')}
function updateUIForLoggedInUser(){document.getElementById('loginBtn').style.display='none';document.getElementById('signupBtn').style.display='none';document.getElementById('userMenu').style.display='block'}
function updateUIForLoggedOutUser(){document.getElementById('loginBtn').style.display='block';document.getElementById('signupBtn').style.display='block';document.getElementById('userMenu').style.display='none'}
async function loadStories(){const{data,error}=await supabaseClient.from('note').select(`
            *,
            note_tag (
                tag (
                    id,
                    name
                )
            )
        `).order('created_at',{ascending:!1});if(error){console.error('Error loading stories:',error);return}
allStories=data.map(story=>({...story,tags:story.note_tag?.map(nt=>nt.tag)||[]}));displayStories(allStories);displayBrowseStories(allStories)}
async function loadTags(){const{data,error}=await supabaseClient.from('tag').select('*');if(error){console.error('Error loading tags:',error);return}
allTags=data;displayTags()}
async function loadUserLibrary(){if(!currentUser)return;const{data,error}=await supabaseClient.from('user_library').select('*').eq('user_id',currentUser.id);if(error){console.error('Error loading user library:',error);return}
userLibrary={reading:[],completed:[],saved:[]};data.forEach(item=>{if(item.status==='reading'){userLibrary.reading.push(item.note_id)}else if(item.status==='completed'){userLibrary.completed.push(item.note_id)}else if(item.status==='saved'){userLibrary.saved.push(item.note_id)}});displayLibrary()}
function saveUserLibrary(){if(!currentUser)return;updateStats()}
function displayStories(stories){const grid=document.getElementById('storiesGrid');if(stories.length===0){grid.innerHTML='<p class="empty-state">No stories found</p>';return}
grid.innerHTML=stories.slice(0,12).map(story=>createStoryCard(story)).join('')}
function displayBrowseStories(stories){const grid=document.getElementById('browseGrid');if(stories.length===0){grid.innerHTML='<p class="empty-state">No stories found</p>';return}
grid.innerHTML=stories.map(story=>createStoryCard(story)).join('')}
function createStoryCard(story){const excerpt=story.content?story.content.substring(0,150)+'...':'No content available';const date=new Date(story.created_at).toLocaleDateString();const progress=getStoryProgress(story.id);return `
        <div class="story-card" onclick="openStory(${story.id})">
            <div class="story-cover">
                <i class="fas fa-book-open"></i>
            </div>
            <div class="story-info">
                <h3 class="story-title">${story.title}</h3>
                <div class="story-meta">
                    <span>${date}</span>
                    <div class="story-tags">
                        ${story.tags.slice(0, 2).map(tag => 
                            `<span class="tag">${tag.name}</span>`
                        ).join('')}
                    </div>
                </div>
                <p class="story-excerpt">${excerpt}</p>
                ${progress > 0 ? `<div class="progress-bar"><div class="progress" style="width: ${progress}%"></div></div>` : ''}
            </div>
        </div>
    `}
function displayTags(){const categoryList=document.getElementById('categoryList');const tagFilters=document.getElementById('tagFilters');const tagHTML=allTags.map(tag=>{const count=allStories.filter(story=>story.tags.some(t=>t.id===tag.id)).length;return `
            <li>
                <a href="#" onclick="filterByTag(${tag.id}); return false;">
                    <span>${tag.name}</span>
                    <span>${count}</span>
                </a>
            </li>
        `}).join('');categoryList.innerHTML=tagHTML;const filterHTML=allTags.map(tag=>`<button class="tag-filter" data-tag="${tag.id}">${tag.name}</button>`).join('');tagFilters.innerHTML=filterHTML}
function displayLibrary(){const grid=document.getElementById('libraryGrid');const activeTab=document.querySelector('.tab-btn.active').dataset.tab;if(!currentUser){grid.innerHTML='<p class="empty-state">Please log in to see your library</p>';return}
const stories=userLibrary[activeTab].map(id=>allStories.find(s=>s.id===id)).filter(s=>s);if(stories.length===0){grid.innerHTML='<p class="empty-state">No stories in this category yet</p>';return}
grid.innerHTML=stories.map(story=>createStoryCard(story)).join('')}
function openStory(id){const story=allStories.find(s=>s.id===id);if(!story)return;currentStory=story;document.getElementById('storyTitle').textContent=story.title;document.getElementById('storyDate').textContent=new Date(story.created_at).toLocaleDateString();document.getElementById('storyContent').textContent=story.content||'No content available';const tagsHTML=story.tags.map(tag=>`<span class="tag">${tag.name}</span>`).join('');document.getElementById('storyTagsReader').innerHTML=tagsHTML;const saveBtn=document.getElementById('saveStoryBtn');if(userLibrary.saved.includes(id)){saveBtn.innerHTML='<i class="fas fa-bookmark"></i> Saved';saveBtn.classList.add('btn-primary');saveBtn.classList.remove('btn-outline')}else{saveBtn.innerHTML='<i class="far fa-bookmark"></i> Save to Library';saveBtn.classList.remove('btn-primary');saveBtn.classList.add('btn-outline')}
if(currentUser&&!userLibrary.reading.includes(id)&&!userLibrary.completed.includes(id)){userLibrary.reading.push(id);await supabaseClient.from('user_library').insert({user_id:currentUser.id,note_id:id,status:'reading',progress:0});saveUserLibrary()}
showPage('reader');setupReadingProgress()}
function setupReadingProgress(){const content=document.getElementById('storyContent');const progressBar=document.getElementById('readingProgress');const updateProgress=()=>{const scrollHeight=content.scrollHeight-content.clientHeight;const scrollTop=window.pageYOffset||document.documentElement.scrollTop;const progress=(scrollTop/scrollHeight)*100;progressBar.style.width=Math.min(progress,100)+'%';if(currentUser&&currentStory){const savedProgress=JSON.parse(localStorage.getItem(`progress_${currentUser.id}`)||'{}');savedProgress[currentStory.id]=Math.min(progress,100);localStorage.setItem(`progress_${currentUser.id}`,JSON.stringify(savedProgress))}};window.addEventListener('scroll',updateProgress);updateProgress()}
function getStoryProgress(storyId){if(!currentUser)return 0;const progress=JSON.parse(localStorage.getItem(`progress_${currentUser.id}`)||'{}');return progress[storyId]||0}
async function saveStoryToLibrary(){if(!currentUser){openAuthModal('login');return}
if(!currentStory)return;const index=userLibrary.saved.indexOf(currentStory.id);if(index>-1){userLibrary.saved.splice(index,1);const{error}=await supabaseClient.from('user_library').delete().eq('user_id',currentUser.id).eq('note_id',currentStory.id).eq('status','saved');if(error)console.error('Error removing from library:',error);}else{userLibrary.saved.push(currentStory.id);const{error}=await supabaseClient.from('user_library').insert({user_id:currentUser.id,note_id:currentStory.id,status:'saved',progress:0});if(error)console.error('Error saving to library:',error);}
saveUserLibrary();openStory(currentStory.id)}
async function markStoryComplete(){if(!currentUser){openAuthModal('login');return}
if(!currentStory)return;const readingIndex=userLibrary.reading.indexOf(currentStory.id);if(readingIndex>-1){userLibrary.reading.splice(readingIndex,1);await supabaseClient.from('user_library').delete().eq('user_id',currentUser.id).eq('note_id',currentStory.id).eq('status','reading')}
if(!userLibrary.completed.includes(currentStory.id)){userLibrary.completed.push(currentStory.id);const{error}=await supabaseClient.from('user_library').insert({user_id:currentUser.id,note_id:currentStory.id,status:'completed',progress:100});if(error)console.error('Error marking as complete:',error);}
saveUserLibrary();alert('Story marked as complete')}
function filterByTag(tagId){const filtered=allStories.filter(story=>story.tags.some(t=>t.id===tagId));displayStories(filtered);showPage('browse')}
function searchStories(query){if(!query){displayStories(allStories);return}
const filtered=allStories.filter(story=>story.title.toLowerCase().includes(query.toLowerCase())||story.content.toLowerCase().includes(query.toLowerCase())||story.tags.some(t=>t.name.toLowerCase().includes(query.toLowerCase())));displayStories(filtered);showPage('browse')}
function sortStories(sortBy){let sorted=[...allStories];switch(sortBy){case 'latest':sorted.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));break;case 'oldest':sorted.sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));break;case 'title':sorted.sort((a,b)=>a.title.localeCompare(b.title));break}
displayBrowseStories(sorted)}
function initializeTheme(){const savedTheme=localStorage.getItem('theme')||'light';applyTheme(savedTheme)}
function applyTheme(theme){document.body.className='';if(theme!=='light'){document.body.classList.add(`${theme}-theme`)}
document.querySelectorAll('.theme-option').forEach(option=>{option.classList.toggle('active',option.dataset.theme===theme)});localStorage.setItem('theme',theme)}
function showPage(pageName){document.querySelectorAll('.page-content').forEach(page=>{page.classList.remove('active')});document.querySelectorAll('.nav-link').forEach(link=>{link.classList.remove('active')});const pageMap={'home':'homePage','library':'libraryPage','browse':'browsePage','reader':'readerPage'};const pageId=pageMap[pageName];if(pageId){document.getElementById(pageId).classList.add('active');const navLink=document.querySelector(`[data-page="${pageName}"]`);if(navLink){navLink.classList.add('active')}}}
function openAuthModal(mode){const modal=document.getElementById('authModal');const title=document.getElementById('authTitle');const switchText=document.getElementById('authSwitchText');const switchLink=document.getElementById('authSwitchLink');if(mode==='login'){title.textContent='Login';switchText.textContent="Don't have an account?";switchLink.textContent='Sign up';switchLink.dataset.mode='signup'}else{title.textContent='Sign Up';switchText.textContent='Already have an account?';switchLink.textContent='Login';switchLink.dataset.mode='login'}
modal.classList.add('show')}
function closeAuthModal(){document.getElementById('authModal').classList.remove('show');document.getElementById('authForm').reset()}
function updateStats(){document.getElementById('totalStories').textContent=allStories.length;document.getElementById('userReading').textContent=userLibrary.reading.length;document.getElementById('userCompleted').textContent=userLibrary.completed.length}
function setupEventListeners(){document.getElementById('themeBtn').addEventListener('click',()=>{document.getElementById('themeOptions').classList.toggle('show')});document.querySelectorAll('.theme-option').forEach(option=>{option.addEventListener('click',()=>{applyTheme(option.dataset.theme);document.getElementById('themeOptions').classList.remove('show')})});document.addEventListener('click',(e)=>{const themeOptions=document.getElementById('themeOptions');const themeBtn=document.getElementById('themeBtn');if(!themeOptions.contains(e.target)&&!themeBtn.contains(e.target)){themeOptions.classList.remove('show')}});document.getElementById('loginBtn').addEventListener('click',()=>openAuthModal('login'));document.getElementById('signupBtn').addEventListener('click',()=>openAuthModal('signup'));document.getElementById('logoutBtn').addEventListener('click',logout);document.querySelector('.close-modal').addEventListener('click',closeAuthModal);document.getElementById('authSwitchLink').addEventListener('click',(e)=>{e.preventDefault();openAuthModal(e.target.dataset.mode)});document.getElementById('authForm').addEventListener('submit',async(e)=>{e.preventDefault();const email=document.getElementById('authEmail').value;const password=document.getElementById('authPassword').value;const mode=document.getElementById('authTitle').textContent.toLowerCase();let success;if(mode==='login'){success=await login(email,password)}else{success=await signup(email,password)}
if(success){closeAuthModal()}});document.getElementById('authModal').addEventListener('click',(e)=>{if(e.target.id==='authModal'){closeAuthModal()}});document.querySelectorAll('.nav-link').forEach(link=>{link.addEventListener('click',(e)=>{e.preventDefault();showPage(link.dataset.page)})});document.querySelector('.logo').addEventListener('click',()=>showPage('home'));document.getElementById('searchBtn').addEventListener('click',()=>{const query=document.getElementById('searchInput').value;searchStories(query)});document.getElementById('searchInput').addEventListener('keypress',(e)=>{if(e.key==='Enter'){const query=e.target.value;searchStories(query)}});document.querySelectorAll('.tab-btn').forEach(btn=>{btn.addEventListener('click',()=>{document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');displayLibrary()})});document.getElementById('sortSelect')?.addEventListener('change',(e)=>{sortStories(e.target.value)});document.addEventListener('click',(e)=>{if(e.target.classList.contains('tag-filter')){e.target.classList.toggle('active');const activeTags=Array.from(document.querySelectorAll('.tag-filter.active')).map(tag=>parseInt(tag.dataset.tag));if(activeTags.length===0){displayBrowseStories(allStories)}else{const filtered=allStories.filter(story=>story.tags.some(t=>activeTags.includes(t.id)));displayBrowseStories(filtered)}}});document.getElementById('backBtn').addEventListener('click',()=>{showPage('home')});document.getElementById('saveStoryBtn').addEventListener('click',saveStoryToLibrary);document.getElementById('markCompleteBtn').addEventListener('click',markStoryComplete)}
window.openStory=openStory;window.filterByTag=filterByTag
