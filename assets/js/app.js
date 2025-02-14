const subjects = [
    { id: 'math', name: 'Математика', emoji: '🔢' },
    { id: 'physics', name: 'Физика', emoji: '⚡' },
    { id: 'informatics', name: 'Информатика', emoji: '💻' },
    { id: 'chemistry', name: 'Химия', emoji: '🧪' },
    { id: 'biology', name: 'Биология', emoji: '🧬' },
    { id: 'history', name: 'История', emoji: '📚' },
    { id: 'social', name: 'Обществознание', emoji: '👥' },
    { id: 'literature', name: 'Литература', emoji: '📖' },
    { id: 'language', name: 'Иностранный язык', emoji: '🌍' },
    { id: 'russian', name: 'Русский язык', emoji: '✍️' },
    { id: 'geography', name: 'География', emoji: '🌎' },
    { id: 'art', name: 'Искусство', emoji: '🎨' }
];

let selectedSubjects = [];
let grades = {};
let userName = '';
let aiRecommendationsData = null;

function showSection(sectionId) {
    document.querySelectorAll('#main-content > section').forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById(sectionId).classList.remove('hidden');
    if (sectionId === 'interests') {
        renderSubjects();
    } else if (sectionId === 'grades') {
        renderGradeSelectors();
    } else if (sectionId === 'name') {
        userName = '';
    }
}

function renderSubjects() {
    const subjectGrid = document.getElementById('subject-grid');
    subjectGrid.innerHTML = '';
    subjects.forEach(subject => {
        const subjectElement = document.createElement('div');
        subjectElement.className = 'subject-item';
        subjectElement.textContent = `${subject.emoji} ${subject.name}`;
        subjectElement.onclick = () => toggleSubject(subject.id, subjectElement);
        subjectGrid.appendChild(subjectElement);
    });
}

function toggleSubject(subjectId, element) {
    if (selectedSubjects.includes(subjectId)) {
        selectedSubjects = selectedSubjects.filter(id => id !== subjectId);
        element.classList.remove('selected');
    } else {
        selectedSubjects.push(subjectId);
        element.classList.add('selected');
    }
}

function renderGradeSelectors() {
    const gradeSelectors = document.getElementById('grade-selectors');
    gradeSelectors.innerHTML = '';
    selectedSubjects.forEach(subjectId => {
        const subject = subjects.find(s => s.id === subjectId);
        const selector = document.createElement('div');
        selector.className = 'flex justify-between items-center';
        selector.innerHTML = `
            <span>${subject.emoji} ${subject.name}</span>
            <div class="space-x-2">
                ${[2, 3, 4, 5].map(grade => `<button class="grade-button" onclick="selectGrade('${subjectId}', ${grade})">${grade}</button>`).join('')}
            </div>
        `;
        gradeSelectors.appendChild(selector);
    });
}

function selectGrade(subjectId, grade) {
    grades[subjectId] = grade;
    const buttons = document.querySelectorAll(`#grade-selectors > div:nth-child(${selectedSubjects.indexOf(subjectId) + 1}) .grade-button`);
    buttons.forEach(button => {
        button.classList.remove('selected');
        if (parseInt(button.textContent) === grade) {
            button.classList.add('selected');
        }
    });
}

async function getAIRecommendations() {
    userName = document.getElementById('name-input').value;
    if (!userName) {
        alert('Пожалуйста, введите ваше имя.');
        showSection('name');
        return;
    }
    const aiRecommendationsContainer = document.getElementById('ai-recommendations');
    aiRecommendationsContainer.innerHTML = '<div class="loader"></div>';
    showSection('results');
    try {
        const response = await fetch('server/apiProxy.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userName,
                selectedSubjects,
                grades
            })
        });
        const data = await response.json();
        aiRecommendationsData = data.recommendations; // Предполагается, что API возвращает объект с полем recommendations
        aiRecommendationsContainer.innerHTML = `
            <h3 class="text-xl font-bold mb-2">Рекомендации ИИ:</h3>
            <div class="prose">${marked.parse(aiRecommendationsData)}</div>
        `;
        showUniversityMap();
    } catch (error) {
        console.error('Error:', error);
        aiRecommendationsContainer.innerHTML = '<p>Произошла ошибка при получении рекомендаций. Пожалуйста, попробуйте еще раз.</p>';
    }
}

function showUniversityMap() {
    const map = L.map('map').setView([55.75, 37.61], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    const universities = [
        { name: 'МГУ', lat: 55.702868, lon: 37.530865 },
        { name: 'СПбГУ', lat: 59.941894, lon: 30.297615 },
        { name: 'МФТИ', lat: 55.928750, lon: 37.521600 }
    ];
    universities.forEach(uni => {
        L.marker([uni.lat, uni.lon]).addTo(map)
            .bindPopup(`<b>${uni.name}</b><br><a href="https://www.vuzopedia.ru/search?q=${encodeURIComponent(uni.name)}" target="_blank" class="button">Подробнее на Vuzopedia</a>`);
    });
}

function resetApp() {
    selectedSubjects = [];
    grades = {};
    userName = '';
    aiRecommendationsData = null;
    document.getElementById('name-input').value = '';
    document.querySelectorAll('.subject-item').forEach(item => item.classList.remove('selected'));
    document.querySelectorAll('.grade-button').forEach(button => button.classList.remove('selected'));
    document.getElementById('ai-recommendations').innerHTML = '';
    showSection('welcome');
}

async function sendMessage() {
    const chatInput = document.getElementById('chat-input');
    const message = chatInput.value.trim();
    if (message) {
        addMessageToChat('user', message);
        chatInput.value = '';
        try {
            const response = await fetch('apiProxy.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });
            const data = await response.json();
            const botReply = data.reply; // Предполагается, что API возвращает объект с полем reply
            addMessageToChat('bot', botReply);
        } catch (error) {
            console.error('Error:', error);
            addMessageToChat('bot', 'Извините, произошла ошибка. Попробуйте еще раз позже.');
        }
    }
}

function addMessageToChat(sender, message) {
    const chatMessages = document.getElementById('chat-messages');
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${sender}-message`;
    messageElement.innerHTML = marked.parse(message);
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

document.getElementById('chat-input').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
});

const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
});

showSection('welcome');