// ==========================================================================
// 1. БАЗА ДАННЫХ КОРИДОРА (Каждая комната — это отдельный объект)
// ==========================================================================
const dungeonMap = {
    start: {
        text: "Вы стоите перед тяжелой дубовой дверью. Из щелей тянет сыростью и едва уловимым запахом серы. Слышен далекий скрежет. Что предпримете?",
        img: "room1.jpg", // Сюда потом вставите свои локальные картинки
        buttons: [
            { text: "Выбить дверь плечом", action: "move", target: "corridor", hpEffect: -15, log: "Вы протаранили дверь плечом! Получено 15 урона." },
            { text: "Использовать заклинание", action: "move", target: "corridor", mpEffect: -20, log: "Заклинание разносит дверь в щепки! Потрачено 20 маны." },
            { text: "Обыскать углы", action: "loot", goldReward: 50, log: "Вы пошарили в темноте и нашли кошель с 50 монетами!" }
        ]
    },
    corridor: {
        text: "Дверь позади захлопнулась. Вы оказались в узком каменном коридоре. На стенах колышутся редкие факелы. Впереди виднеется развилка: налево уходит темный туннель, направо — винтовая лестница вверх.",
        img: "room2.jpg",
        buttons: [
            { text: "Пойти налево в туннель", action: "move", target: "crypt", log: "Вы осторожно углубляетесь в сырой туннель." },
            { text: "Пойти направо на лестницу", action: "move", target: "tower", log: "Вы начинаете подъем по винтовой лестнице." },
            { text: "Обыскать скелет у стены", action: "loot", goldReward: 30, log: "В ржавых доспехах покойника вы нашли 30 монет." }
        ]
    },
    crypt: {
        text: "Туннель привел вас в заброшенную крипту. Из разбитых саркофагов поднимается костлявая фигура Стража Склепа! Его глаза горят мертвенным синим огнем.",
        img: "room3.jpg",
        buttons: [
            { text: "Атаковать мечом", action: "move", target: "win", hpEffect: -30, log: "В яростной схватке вы одолели Стража, но он успел вас ранить (-30 HP)!" },
            { text: "Применить магию", action: "move", target: "win", mpEffect: -40, log: "Мощный разряд молнии испепеляет скелет на месте! (-40 MP)" },
            { text: "Бежать назад!", action: "move", target: "corridor", log: "Вы в панике отступаете назад в коридор." }
        ]
    },
    tower: {
        text: "Лестница вывела вас в полуразрушенную башню. Сквозь проломы в крыше видно грозовое небо. На алтаре лежит древний артефакт, но его охраняет огромный летучий нетопырь!",
        img: "room4.jpg",
        buttons: [
            { text: "Сразиться с чудовищем", action: "move", target: "win", hpEffect: -40, log: "Вы победили тварь, но битва была тяжелой (-40 HP)!" },
            { text: "Сбежать по лестнице", action: "move", target: "corridor", log: "Вы прыжками скатываетесь по ступеням обратно." }
        ]
    },
    win: {
        text: "Поздравляем! Путь очищен, опасности позади. Вы нашли сокровища древнего склепа и успешно завершили этот коридор подземелья!",
        img: "win.jpg",
        buttons: [
            { text: "Начать заново", action: "reset", log: "История начинается сначала..." }
        ]
    }
};

// ==========================================================================
// 2. НАХОДИМ ВСЕ НЕОБХОДИМЫЕ DOM-УЗЛЫ
// ==========================================================================
const hpBar = document.getElementById('hp-bar');
const mpBar = document.getElementById('mp-bar');
const goldVal = document.getElementById('gold-val');
const locationImg = document.getElementById('location-img');
const storyText = document.getElementById('story-text');
const actionButtons = document.getElementById('action-buttons');
const logContainer = document.getElementById('log-container');

// ==========================================================================
// 3. СОСТОЯНИЕ ИГРОКА (STATE)
// ==========================================================================
let player = {
    hp: 100,
    mp: 80,
    gold: 150,
    currentRoom: "start"
};

// ==========================================================================
// 4. ФУНКЦИИ РАБОТЫ С DOM
// ==========================================================================

// Функция отрисовки интерфейса (статы и золото)
function updateUI() {
    // Ограничители, чтобы статы не уходили в минус или выше 100
    player.hp = Math.max(0, Math.min(100, player.hp));
    player.mp = Math.max(0, Math.min(100, player.mp));

    // Меняем ширину баров
    hpBar.style.width = player.hp + '%';
    mpBar.style.width = player.mp + '%';

    // Меняем текстовое значение золота
    goldVal.textContent = player.gold;

    // Если здоровье упало до 0 — игрок погиб
    if (player.hp <= 0) {
        gameOver();
    }
}

// Функция добавления новой строчки в текстовый Журнал событий
function pushToLog(message, type = "normal") {
    const row = document.createElement('p');
    row.classList.add('log-row');
    if (type !== "normal") row.classList.add(type); // Применяем цвет (system/damage)
    
    row.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logContainer.appendChild(row);
    
    // Автоматическая прокрутка журнала вниз при добавлении записей
    logContainer.scrollTop = logContainer.scrollHeight;
}

// Функция переключения игровой комнаты
function goToRoom(roomKey) {
    player.currentRoom = roomKey;
    const room = dungeonMap[roomKey];

    // Меняем текст квеста и картинку
    storyText.textContent = room.text;
    locationImg.src = room.img;

    // Очищаем старые кнопки действий
    actionButtons.innerHTML = "";

    // Динамически создаем новые кнопки через DOM-методы
    room.buttons.forEach((btnData, index) => {
        const button = document.createElement('button');
        button.classList.add('btn');
        button.textContent = btnData.text;
        
        // Привязываем индекс кнопки, чтобы знать, на какую именно нажали
        button.dataset.index = index; 
        
        actionButtons.appendChild(button);
    });
}

// Сценарий смерти
function gameOver() {
    storyText.textContent = "Вы погибли в темных глубинах коридора... Ваше приключение окончено.";
    actionButtons.innerHTML = `<button class="btn" id="retry-btn">Воскреснуть</button>`;
    pushToLog("Вы испустили дух...", "damage");
    
    document.getElementById('retry-btn').addEventListener('click', resetGame);
}

// Сброс игры к началу
function resetGame() {
    player.hp = 100;
    player.mp = 80;
    player.gold = 150;
    updateUI();
    goToRoom("start");
    logContainer.innerHTML = `<p class="log-row system">Вы восстали из пепла и вошли в склеп...</p>`;
}

// ==========================================================================
// 5. НАВЕШИВАЕМ СЛУШАТЕЛИ СОБЫТИЙ (ДЕЛЕГИРОВАНИЕ)
// ==========================================================================
actionButtons.addEventListener('click', (event) => {
    // Проверяем, что клик пришелся именно на кнопку
    if (!event.target.classList.contains('btn')) return;

    const btnIndex = event.target.dataset.index;
    const currentRoomData = dungeonMap[player.currentRoom];
    const clickedButton = currentRoomData.buttons[btnIndex];

    // Применяем эффекты кнопки к игроку
    if (clickedButton.hpEffect) player.hp += clickedButton.hpEffect;
    if (clickedButton.mpEffect) player.mp += clickedButton.mpEffect;
    if (clickedButton.goldReward) {
        player.gold += clickedButton.goldReward;
        // Чтобы нельзя было бесконечно фармить золото в одной комнате, обнуляем награду после клика
        clickedButton.goldReward = 0; 
    }

    // Пишем лог (определяем цвет строки в зависимости от эффекта)
    let logType = "normal";
    if (clickedButton.hpEffect && clickedButton.hpEffect < 0) logType = "damage";
    if (clickedButton.goldReward > 0) logType = "system";
    
    pushToLog(clickedButton.log, logType);

    // Логика перехода или перезапуска
    if (clickedButton.action === "move") {
        goToRoom(clickedButton.target);
    } else if (clickedButton.action === "reset") {
        resetGame();
    }

    // Синхронизируем изменения с экраном
    updateUI();
});

// ЗАПУСК ИГРЫ ПРИ ПЕРВОЙ ЗАГРУЗКЕ СТРАНИЦЫ
updateUI();
goToRoom("start");

// ==========================================================================
// 6. ИНВЕНТАРЬ: ИСПОЛЬЗОВАНИЕ ЗЕЛИЙ ИЗ СУМКИ
// ==========================================================================

// Храним количество банок в состоянии (state)
let inventory = {
    hpPotions: 2,
    mpPotions: 1
};

const potionHpBtn = document.getElementById('potion-hp');
const potionMpBtn = document.getElementById('potion-mp');

// Клик по зелью здоровья
potionHpBtn.addEventListener('click', () => {
    if (inventory.hpPotions > 0) {
        if (player.hp === 100) {
            pushToLog("У вас уже максимальное здоровье!", "system");
            return;
        }
        
        inventory.hpPotions--; // Тратим банку
        player.hp += 30;       // Лечим на 30 ОЗ
        
        // Обновляем текст кнопки в DOM, показывая новый остаток
        potionHpBtn.textContent = `🧪 Зелье ОЗ (${inventory.hpPotions})`;
        pushToLog("Вы выпили Зелье ОЗ и восстановили 30 здоровья.", "system");
        
        // Перерисовываем полоски
        updateUI();
    } else {
        pushToLog("У вас закончились зелья здоровья!", "damage");
    }
});

// Клик по зелью маны
potionMpBtn.addEventListener('click', () => {
    if (inventory.mpPotions > 0) {
        if (player.mp === 100) {
            pushToLog("У вас уже вся мана полная!", "system");
            return;
        }
        
        inventory.mpPotions--; // Тратим банку
        player.mp += 30;       // Восстанавливаем 30 ОМ
        
        // Обновляем текст кнопки в DOM
        potionMpBtn.textContent = `🧪 Зелье ОМ (${inventory.mpPotions})`;
        pushToLog("Вы выпили Зелье ОМ и восстановили 30 маны.", "system");
        
        updateUI();
    } else {
        pushToLog("У вас закончились зелья маны!", "damage");
    }
});
