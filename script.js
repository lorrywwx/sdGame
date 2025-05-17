// 游戏状态
let selectedCell = null;
let gameBoard = Array(9).fill().map(() => Array(9).fill(0));
let solution = Array(9).fill().map(() => Array(9).fill(0));
let errors = 0;
let timer = 0;
let timerInterval;
let currentDifficulty = 'easy'; // 默认难度

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    initializeBoard();
    setupEventListeners();
    startTimer();
});

// 检查数字在特定位置是否有效
function isValidForPuzzle(puzzle, row, col, num) {
    // 检查行
    for (let i = 0; i < 9; i++) {
        if (i !== col && puzzle[row][i] === num) {
            return false;
        }
    }
    
    // 检查列
    for (let i = 0; i < 9; i++) {
        if (i !== row && puzzle[i][col] === num) {
            return false;
        }
    }
    
    // 检查3x3方格
    const boxRow = Math.floor(row/3) * 3;
    const boxCol = Math.floor(col/3) * 3;
    for (let i = boxRow; i < boxRow + 3; i++) {
        for (let j = boxCol; j < boxCol + 3; j++) {
            if ((i !== row || j !== col) && puzzle[i][j] === num) {
                return false;
            }
        }
    }
    
    return true;
}

// 生成完整的数独解
function generateFullSolution() {
    const grid = Array(9).fill().map(() => Array(9).fill(0));
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    
    function fillGrid(grid) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (grid[row][col] === 0) {
                    // 随机打乱1-9的顺序
                    for (let i = numbers.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
                    }
                    
                    for (let num of numbers) {
                        if (isValidForPuzzle(grid, row, col, num)) {
                            grid[row][col] = num;
                            if (fillGrid(grid)) {
                                return true;
                            }
                            grid[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }
    
    fillGrid(grid);
    return grid;
}

// 生成新的数独题目
function generateNewPuzzle() {
    // 首先生成完整的解
    const solution = generateFullSolution();
    const puzzle = JSON.parse(JSON.stringify(solution));
    
    // 根据难度设置需要移除的单元格数量
    let cellsToRemove;
    switch(currentDifficulty) {
        case 'easy':
            cellsToRemove = 35; // 简易：保留46个数字
            break;
        case 'medium':
            cellsToRemove = 45; // 中等：保留36个数字
            break;
        case 'hard':
            cellsToRemove = 55; // 困难：保留26个数字
            break;
        default:
            cellsToRemove = 45;
    }
    
    // 随机移除数字
    let removed = 0;
    while (removed < cellsToRemove) {
        const row = Math.floor(Math.random() * 9);
        const col = Math.floor(Math.random() * 9);
        
        if (puzzle[row][col] !== 0) {
            puzzle[row][col] = 0;
            removed++;
        }
    }
    
    return {
        puzzle: puzzle,
        solution: solution
    };
}

// 修改初始化数独板函数
function initializeBoard() {
    const board = document.getElementById('board');
    board.innerHTML = '';
    
    // 生成新的数独题目和解决方案
    const generated = generateNewPuzzle();
    const puzzle = generated.puzzle;
    solution = generated.solution; // 保存解决方案
    
    gameBoard = puzzle.map(row => [...row]);

    // 创建单元格
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            const cell = document.createElement('button');
            cell.className = 'cell';
            if (puzzle[i][j] !== 0) {
                cell.textContent = puzzle[i][j];
                cell.classList.add('given');
            }
            cell.dataset.row = i;
            cell.dataset.col = j;
            board.appendChild(cell);
        }
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 单元格选择
    document.getElementById('board').addEventListener('click', (e) => {
        if (e.target.classList.contains('cell') && !e.target.classList.contains('given')) {
            if (selectedCell) selectedCell.classList.remove('selected');
            selectedCell = e.target;
            selectedCell.classList.add('selected');
            highlightRelatedCells(selectedCell);
        }
    });

    // 数字按钮
    document.querySelectorAll('.number').forEach(button => {
        button.addEventListener('click', () => {
            if (selectedCell && !selectedCell.classList.contains('given')) {
                const number = parseInt(button.dataset.number);
                const row = parseInt(selectedCell.dataset.row);
                const col = parseInt(selectedCell.dataset.col);
                
                // 总是显示输入的数字
                selectedCell.textContent = number;
                gameBoard[row][col] = number;
                
                if (isValidMove(row, col, number)) {
                    selectedCell.classList.remove('error');
                    
                    if (isGameComplete()) {
                        alert('恭喜！你已完成数独！');
                        clearInterval(timerInterval);
                    }
                } else {
                    selectedCell.classList.add('error');
                    errors++;
                    document.getElementById('errors').textContent = errors;
                    if (errors >= 3) {
                        clearInterval(timerInterval);
                        document.getElementById('game-over-modal').style.display = 'block';
                    }
                }
            }
        });
    });

    // 新游戏按钮
    document.getElementById('new-game-btn').addEventListener('click', () => {
        initializeBoard();
        resetGameState();
    });

    // 关闭教程模态框
    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('tutorial-modal').style.display = 'none';
    });

    // 添加提示按钮事件监听
    document.getElementById('hint-btn').addEventListener('click', showHint);

    // 添加查看答案按钮事件监听
    document.getElementById('show-answer-btn').addEventListener('click', () => {
        if (confirm('确定要查看答案吗？这将结束当前游戏。')) {
            showAnswer();
        }
    });

    // 修改第二次机会按钮事件监听
    document.getElementById('second-chance-btn').addEventListener('click', () => {
        document.getElementById('game-over-modal').style.display = 'none';
        resetGameStateKeepProgress();
    });

    // 添加游戏结束后的新游戏按钮事件监听
    document.getElementById('new-game-after-loss-btn').addEventListener('click', () => {
        document.getElementById('game-over-modal').style.display = 'none';
        initializeBoard();
        resetGameState();
    });

    // 添加删除按钮事件监听
    document.getElementById('delete-btn').addEventListener('click', () => {
        if (selectedCell && !selectedCell.classList.contains('given')) {
            selectedCell.textContent = '';
            const row = parseInt(selectedCell.dataset.row);
            const col = parseInt(selectedCell.dataset.col);
            gameBoard[row][col] = 0;
            selectedCell.classList.remove('error');
        }
    });

    // 添加难度选择按钮事件监听
    document.getElementById('easy-btn').addEventListener('click', () => {
        setDifficulty('easy');
    });
    
    document.getElementById('medium-btn').addEventListener('click', () => {
        setDifficulty('medium');
    });
    
    document.getElementById('hard-btn').addEventListener('click', () => {
        setDifficulty('hard');
    });

    // 添加难度信息按钮事件监听
    document.getElementById('difficulty-info-btn').addEventListener('click', () => {
        document.getElementById('difficulty-modal').style.display = 'block';
    });

    // 添加难度模态框关闭按钮事件监听
    document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });

    // 点击模态框外部关闭
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

// 高亮相关单元格
function highlightRelatedCells(cell) {
    document.querySelectorAll('.cell').forEach(c => c.classList.remove('highlight'));
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    
    // 高亮同行同列
    document.querySelectorAll('.cell').forEach(c => {
        const r = parseInt(c.dataset.row);
        const c_col = parseInt(c.dataset.col);
        if (r === row || c_col === col || (Math.floor(r/3) === Math.floor(row/3) && Math.floor(c_col/3) === Math.floor(col/3))) {
            c.classList.add('highlight');
        }
    });
}

// 验证移动是否有效
function isValidMove(row, col, num) {
    // 检查行
    for (let i = 0; i < 9; i++) {
        if (i !== col && gameBoard[row][i] === num) {
            return false;
        }
    }
    
    // 检查列
    for (let i = 0; i < 9; i++) {
        if (i !== row && gameBoard[i][col] === num) {
            return false;
        }
    }
    
    // 检查3x3方格
    const boxRow = Math.floor(row/3) * 3;
    const boxCol = Math.floor(col/3) * 3;
    for (let i = boxRow; i < boxRow + 3; i++) {
        for (let j = boxCol; j < boxCol + 3; j++) {
            if ((i !== row || j !== col) && gameBoard[i][j] === num) {
                return false;
            }
        }
    }
    
    return true;
}

// 检查游戏是否完成
function isGameComplete() {
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (gameBoard[i][j] === 0) return false;
        }
    }
    return true;
}

// 计时器
function startTimer() {
    timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    timer++;
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    document.getElementById('timer').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// 分析并显示提示
function showHint() {
    const hint = analyzeBoard();
    if (hint) {
        showAnalysisSteps(hint);
    }
}

// 分析当前局面
function analyzeBoard() {
    // 寻找只有一个可能值的格子
    const singleCandidates = [];
    
    // 分析每个空格的可能数字
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (gameBoard[row][col] === 0) {
                const possibleNumbers = findPossibleNumbers(row, col);
                if (possibleNumbers.size === 1) {
                    singleCandidates.push({
                        row: row,
                        col: col,
                        value: Array.from(possibleNumbers)[0],
                        possibleCount: 1
                    });
                }
            }
        }
    }
    
    // 如果找到了只有唯一可能值的格子，返回第一个
    if (singleCandidates.length > 0) {
        // 按照可能值数量排序（理论上都是1）
        singleCandidates.sort((a, b) => a.possibleCount - b.possibleCount);
        const candidate = singleCandidates[0];
        return analyzeCellPossibilities(candidate.row, candidate.col);
    }
    
    // 如果没有只有唯一可能值的格子，寻找可能值最少的格子
    const allCandidates = [];
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (gameBoard[row][col] === 0) {
                const possibleNumbers = findPossibleNumbers(row, col);
                if (possibleNumbers.size > 0) {
                    allCandidates.push({
                        row: row,
                        col: col,
                        possibleCount: possibleNumbers.size,
                        values: Array.from(possibleNumbers)
                    });
                }
            }
        }
    }
    
    if (allCandidates.length > 0) {
        // 按照可能值数量排序
        allCandidates.sort((a, b) => a.possibleCount - b.possibleCount);
        const candidate = allCandidates[0];
        return analyzeCellPossibilities(candidate.row, candidate.col);
    }
    
    return null;
}

// 分析单个格子的可能性
function analyzeCellPossibilities(row, col) {
    if (gameBoard[row][col] !== 0) return null;
    
    // 获取这个格子的所有可能数字
    const possibleNumbers = findPossibleNumbers(row, col);
    
    if (possibleNumbers.size === 0) return null;
    
    // 收集分析步骤
    const steps = [];
    
    // 1. 收集行信息
    const rowNumbers = new Set();
    for (let i = 0; i < 9; i++) {
        if (gameBoard[row][i] !== 0) {
            rowNumbers.add(gameBoard[row][i]);
        }
    }
    steps.push({
        type: 'row',
        numbers: Array.from(rowNumbers),
        message: `第${row + 1}行已经包含数字：${Array.from(rowNumbers).join(', ')}`
    });

    // 2. 收集列信息
    const colNumbers = new Set();
    for (let i = 0; i < 9; i++) {
        if (gameBoard[i][col] !== 0) {
            colNumbers.add(gameBoard[i][col]);
        }
    }
    steps.push({
        type: 'col',
        numbers: Array.from(colNumbers),
        message: `第${col + 1}列已经包含数字：${Array.from(colNumbers).join(', ')}`
    });

    // 3. 收集3x3方格信息
    const blockRow = Math.floor(row/3) * 3;
    const blockCol = Math.floor(col/3) * 3;
    const blockNumbers = new Set();
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (gameBoard[blockRow + i][blockCol + j] !== 0) {
                blockNumbers.add(gameBoard[blockRow + i][blockCol + j]);
            }
        }
    }
    steps.push({
        type: 'block',
        numbers: Array.from(blockNumbers),
        message: `当前3x3方格已经包含数字：${Array.from(blockNumbers).join(', ')}`
    });

    // 4. 得出结论
    const allPossible = [1,2,3,4,5,6,7,8,9];
    const impossible = new Set([...rowNumbers, ...colNumbers, ...blockNumbers]);
    const possible = allPossible.filter(n => !impossible.has(n));
    const possibleStr = possible.length > 0 ? possible.join(', ') : '没有可能的数字（可能存在错误）';

    steps.push({
        type: 'conclusion',
        numbers: possible,
        message: `因此，这个格子只能填入：${possibleStr}`
    });

    if (possible.length === 1) {
        steps.push({
            type: 'final',
            message: `这个单元格的唯一可能值是 ${possible[0]}`
        });
    } else if (possible.length > 1) {
        steps.push({
            type: 'final',
            message: `这个单元格有${possible.length}个可能值: ${possible.join(', ')}`
        });
    }

    return {
        cells: [{
            row: row,
            col: col,
            value: possible[0]
        }],
        steps: steps
    };
}

// 显示分析步骤
function showAnalysisSteps(hint) {
    const modal = document.getElementById('tutorial-modal');
    const content = document.getElementById('tutorial-content');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // 防止页面滚动

    let currentStep = 0;
    const steps = hint.steps;

    function updateStep() {
        const step = steps[currentStep];
        content.innerHTML = `
            <div class="step-content">
                <p class="step-message">${step.message}</p>
            </div>
        `;

        // 更新步骤计数器
        document.querySelector('.step-counter').textContent = `${currentStep + 1}/${steps.length}`;

        // 高亮相关单元格
        highlightAnalysisStep(hint.cells[0].row, hint.cells[0].col, step);

        // 更新按钮状态
        document.getElementById('prev-step').disabled = currentStep === 0;
        document.getElementById('next-step').disabled = currentStep === steps.length - 1;
    }

    updateStep();

    // 重新绑定事件监听器
    document.getElementById('prev-step').onclick = () => {
        if (currentStep > 0) {
            currentStep--;
            updateStep();
        }
    };

    document.getElementById('next-step').onclick = () => {
        if (currentStep < steps.length - 1) {
            currentStep++;
            updateStep();
        }
    };

    // 更新关闭按钮事件
    document.querySelector('.close').onclick = () => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        // 清除所有高亮
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('highlight-main', 'highlight-related');
        });
    };
}

// 根据分析步骤高亮相关单元格
function highlightAnalysisStep(row, col, step) {
    // 清除之前的高亮
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('highlight', 'highlight-main', 'highlight-related');
    });

    // 高亮目标格子
    const targetCell = document.querySelectorAll('.cell')[row * 9 + col];
    targetCell.classList.add('highlight-main');

    // 根据步骤类型高亮相关格子
    switch (step.type) {
        case 'row':
            for (let i = 0; i < 9; i++) {
                if (i !== col && gameBoard[row][i] !== 0) {
                    const cell = document.querySelectorAll('.cell')[row * 9 + i];
                    cell.classList.add('highlight-related');
                }
            }
            break;
        case 'col':
            for (let i = 0; i < 9; i++) {
                if (i !== row && gameBoard[i][col] !== 0) {
                    const cell = document.querySelectorAll('.cell')[i * 9 + col];
                    cell.classList.add('highlight-related');
                }
            }
            break;
        case 'block':
            const blockRow = Math.floor(row/3) * 3;
            const blockCol = Math.floor(col/3) * 3;
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    if ((blockRow + i !== row || blockCol + j !== col) && 
                        gameBoard[blockRow + i][blockCol + j] !== 0) {
                        const cell = document.querySelectorAll('.cell')[(blockRow + i) * 9 + blockCol + j];
                        cell.classList.add('highlight-related');
                    }
                }
            }
            break;
    }
}

// 查找某个位置可能的数字
function findPossibleNumbers(row, col) {
    const possibleNumbers = new Set([1,2,3,4,5,6,7,8,9]);
    
    // 检查行
    for (let i = 0; i < 9; i++) {
        possibleNumbers.delete(gameBoard[row][i]);
    }
    
    // 检查列
    for (let i = 0; i < 9; i++) {
        possibleNumbers.delete(gameBoard[i][col]);
    }
    
    // 检查3x3方格
    const blockRow = Math.floor(row/3) * 3;
    const blockCol = Math.floor(col/3) * 3;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            possibleNumbers.delete(gameBoard[blockRow + i][blockCol + j]);
        }
    }
    
    return possibleNumbers;
}

// 显示答案功能
function showAnswer() {
    // 确保我们有解决方案
    if (!solution) {
        alert('无法显示解决方案');
        return;
    }

    // 停止计时器
    clearInterval(timerInterval);

    // 遍历所有单元格
    const cells = document.querySelectorAll('.cell');
    cells.forEach((cell, index) => {
        const row = Math.floor(index / 9);
        const col = index % 9;
        
        // 如果是空格子或错误的数字
        if (!cell.classList.contains('given')) {
            // 添加答案，使用不同的样式
            cell.textContent = solution[row][col];
            cell.classList.add('answer');
        }
    });

    // 禁用所有数字按钮
    document.querySelectorAll('.number').forEach(btn => {
        btn.disabled = true;
    });

    // 禁用提示和查看答案按钮
    document.getElementById('hint-btn').disabled = true;
    document.getElementById('show-answer-btn').disabled = true;
}

// 添加一个新函数用于重置游戏状态但保留当前进度
function resetGameStateKeepProgress() {
    // 重置错误计数
    errors = 0;
    document.getElementById('errors').textContent = '0';
    
    // 重置计时器
    timer = 0;
    updateTimer();
    clearInterval(timerInterval);
    startTimer();
    
    // 重新启用所有按钮
    document.querySelectorAll('.number').forEach(btn => {
        btn.disabled = false;
    });
    
    document.getElementById('hint-btn').disabled = false;
    document.getElementById('show-answer-btn').disabled = false;
    
    // 只移除高亮相关的类，保留错误标记
    document.querySelectorAll('.cell').forEach(cell => {
        if (!cell.classList.contains('given')) {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const num = parseInt(cell.textContent);
            
            if (num && !isValidMove(row, col, num)) {
                cell.classList.add('error');
            }
        }
        cell.classList.remove('highlight', 'highlight-main', 'highlight-related', 'selected');
    });
    
    // 重置选中状态
    selectedCell = null;
}

// 修改完整的重置函数（用于新游戏）
function resetGameState() {
    // 重置错误计数
    errors = 0;
    document.getElementById('errors').textContent = '0';
    
    // 重置计时器
    timer = 0;
    updateTimer();
    clearInterval(timerInterval);
    startTimer();
    
    // 重新启用所有按钮
    document.querySelectorAll('.number').forEach(btn => {
        btn.disabled = false;
    });
    
    document.getElementById('hint-btn').disabled = false;
    document.getElementById('show-answer-btn').disabled = false;
    
    // 清除所有单元格的内容和样式
    document.querySelectorAll('.cell').forEach(cell => {
        if (!cell.classList.contains('given')) {
            cell.textContent = '';
            gameBoard[cell.dataset.row][cell.dataset.col] = 0;
        }
        cell.classList.remove('answer', 'highlight', 'highlight-main', 'highlight-related', 'selected', 'error');
    });
    
    // 重置选中状态
    selectedCell = null;
}

// 设置难度
function setDifficulty(difficulty) {
    // 更新当前难度
    currentDifficulty = difficulty;
    
    // 更新按钮样式
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`${difficulty}-btn`).classList.add('active');
    
    // 如果玩家想要立即更改游戏，提示是否开始新游戏
    if (timer > 0 && confirm('是否要以新的难度开始游戏？')) {
        initializeBoard();
        resetGameState();
    }
} 