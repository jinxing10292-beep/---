class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // 게임 상태
        this.state = 'menu'; // menu, playing, paused, gameover
        this.score = 0;
        this.coins = 0;
        this.totalCoins = parseInt(localStorage.getItem('totalCoins')) || 0;
        
        // 플레이어 스탯
        this.stats = {
            health: parseInt(localStorage.getItem('health')) || 1,
            speed: parseInt(localStorage.getItem('speed')) || 1,
            grade: 'F'
        };
        this.stats.grade = this.calculateGrade();
        
        // 플레이어
        this.player = {
            x: 150,
            y: 400,
            width: 50,
            height: 60,
            velocityY: 0,
            isJumping: false,
            isDucking: false
        };
        
        // 게임 설정
        this.gravity = 0.8;
        this.jumpPower = -15;
        this.groundY = 400;
        this.gameSpeed = 5 + this.stats.speed;
        this.maxHealth = 3 + this.stats.health;
        this.currentHealth = this.maxHealth;
        
        // 장애물과 아이템
        this.obstacles = [];
        this.items = [];
        this.obstacleTimer = 0;
        this.itemTimer = 0;
        
        this.setupControls();
        this.setupMobileControls();
        this.setupButtons();
        this.updateStatsDisplay();
    }
    
    setupButtons() {
        document.getElementById('upgradeHealthBtn').addEventListener('click', () => this.upgradeHealth());
        document.getElementById('upgradeSpeedBtn').addEventListener('click', () => this.upgradeSpeed());
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('pauseButton').addEventListener('click', () => this.togglePause());
        document.getElementById('returnMenuBtn').addEventListener('click', () => this.returnToMenu());
    }
    
    resizeCanvas() {
        const container = document.getElementById('game-container');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        
        // 게임 요소 위치 조정
        this.groundY = this.canvas.height - 200;
        if (this.player) {
            this.player.y = this.groundY;
        }
    }

    setupControls() {
        // 키보드 컨트롤
        document.addEventListener('keydown', (e) => {
            if (this.state !== 'playing') return;
            
            if (e.code === 'Space' && !this.player.isJumping) {
                this.jump();
            }
            if (e.code === 'ArrowDown') {
                this.duck();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowDown') {
                this.standUp();
            }
        });
        
        // 터치 컨트롤 (화면 탭)
        this.canvas.addEventListener('touchstart', (e) => {
            if (this.state !== 'playing') return;
            e.preventDefault();
            
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const touchY = touch.clientY - rect.top;
            
            // 화면 상단 탭 = 점프, 하단 탭 = 앉기
            if (touchY < this.canvas.height / 2) {
                this.jump();
            } else {
                this.duck();
            }
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.standUp();
        });
    }
    
    setupMobileControls() {
        const jumpBtn = document.getElementById('jumpButton');
        const duckBtn = document.getElementById('duckButton');
        
        if (jumpBtn) {
            jumpBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (this.state === 'playing') {
                    this.jump();
                }
            });
        }
        
        if (duckBtn) {
            duckBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (this.state === 'playing') {
                    this.duck();
                }
            });
            
            duckBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (this.state === 'playing') {
                    this.standUp();
                }
            });
        }
    }
    
    jump() {
        if (!this.player.isJumping && !this.player.isDucking) {
            this.player.velocityY = this.jumpPower;
            this.player.isJumping = true;
        }
    }
    
    duck() {
        if (!this.player.isJumping) {
            this.player.isDucking = true;
            this.player.height = 30;
            this.player.y = this.groundY + 30;
        }
    }
    
    standUp() {
        this.player.isDucking = false;
        this.player.height = 60;
        this.player.y = this.groundY;
    }
    
    calculateGrade() {
        const total = this.stats.health + this.stats.speed;
        if (total >= 20) return 'S';
        if (total >= 15) return 'A';
        if (total >= 10) return 'B';
        if (total >= 7) return 'C';
        if (total >= 5) return 'D';
        return 'F';
    }
    
    upgradeHealth() {
        if (this.totalCoins >= 100) {
            this.totalCoins -= 100;
            this.stats.health++;
            this.saveStats();
            this.updateStatsDisplay();
            alert('체력이 강화되었습니다!');
        } else {
            alert('코인이 부족합니다!');
        }
    }
    
    upgradeSpeed() {
        if (this.totalCoins >= 100) {
            this.totalCoins -= 100;
            this.stats.speed++;
            this.saveStats();
            this.updateStatsDisplay();
            alert('속도가 강화되었습니다!');
        } else {
            alert('코인이 부족합니다!');
        }
    }
    
    saveStats() {
        localStorage.setItem('health', this.stats.health);
        localStorage.setItem('speed', this.stats.speed);
        localStorage.setItem('totalCoins', this.totalCoins);
        this.stats.grade = this.calculateGrade();
    }
    
    updateStatsDisplay() {
        document.getElementById('healthLevel').textContent = this.stats.health;
        document.getElementById('speedLevel').textContent = this.stats.speed;
        document.getElementById('gradeLevel').textContent = this.stats.grade;
        document.getElementById('totalCoins').textContent = this.totalCoins;
    }
    
    startGame() {
        this.state = 'playing';
        this.score = 0;
        this.coins = 0;
        this.currentHealth = this.maxHealth;
        this.gameSpeed = 5 + this.stats.speed;
        this.obstacles = [];
        this.items = [];
        this.obstacleTimer = 0;
        this.itemTimer = 0;
        
        document.getElementById('mainMenu').classList.add('hidden');
        document.getElementById('gameUI').classList.remove('hidden');
        
        this.gameLoop();
    }
    
    togglePause() {
        if (this.state === 'playing') {
            this.state = 'paused';
            document.getElementById('pauseButton').textContent = '계속하기';
        } else if (this.state === 'paused') {
            this.state = 'playing';
            document.getElementById('pauseButton').textContent = '일시정지';
            this.gameLoop();
        }
    }
    
    returnToMenu() {
        this.state = 'menu';
        document.getElementById('gameOver').classList.add('hidden');
        document.getElementById('mainMenu').classList.remove('hidden');
        this.updateStatsDisplay();
    }
    
    gameLoop() {
        if (this.state !== 'playing') return;
        
        this.update();
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        // 점수 증가
        this.score++;
        document.getElementById('score').textContent = this.score;
        
        // 플레이어 물리
        if (this.player.isJumping) {
            this.player.velocityY += this.gravity;
            this.player.y += this.player.velocityY;
            
            if (this.player.y >= this.groundY) {
                this.player.y = this.groundY;
                this.player.velocityY = 0;
                this.player.isJumping = false;
            }
        }
        
        // 장애물 생성
        this.obstacleTimer++;
        if (this.obstacleTimer > 100) {
            this.obstacles.push({
                x: this.canvas.width,
                y: this.groundY + 20,
                width: 40,
                height: 60,
                type: 'obstacle'
            });
            this.obstacleTimer = 0;
        }
        
        // 아이템(시험지) 생성
        this.itemTimer++;
        if (this.itemTimer > 80) {
            const yPos = Math.random() > 0.5 ? this.groundY - 50 : this.groundY - 100;
            this.items.push({
                x: this.canvas.width,
                y: yPos,
                width: 30,
                height: 30,
                type: Math.random() > 0.3 ? 'paper' : 'coin'
            });
            this.itemTimer = 0;
        }
        
        // 장애물 이동 및 충돌
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            this.obstacles[i].x -= this.gameSpeed;
            
            if (this.checkCollision(this.player, this.obstacles[i])) {
                this.currentHealth--;
                this.obstacles.splice(i, 1);
                
                if (this.currentHealth <= 0) {
                    this.gameOver();
                }
            } else if (this.obstacles[i].x + this.obstacles[i].width < 0) {
                this.obstacles.splice(i, 1);
            }
        }
        
        // 아이템 이동 및 수집
        for (let i = this.items.length - 1; i >= 0; i--) {
            this.items[i].x -= this.gameSpeed;
            
            if (this.checkCollision(this.player, this.items[i])) {
                if (this.items[i].type === 'paper') {
                    this.score += 50;
                } else {
                    this.coins++;
                    document.getElementById('coins').textContent = this.coins;
                }
                this.items.splice(i, 1);
            } else if (this.items[i].x + this.items[i].width < 0) {
                this.items.splice(i, 1);
            }
        }
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    draw() {
        // 배경
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 땅
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, this.groundY + 80, this.canvas.width, 120);
        
        // 플레이어 (정태)
        this.ctx.fillStyle = '#FF6B6B';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        this.ctx.fillStyle = '#000';
        this.ctx.font = '12px Arial';
        this.ctx.fillText('정태', this.player.x + 10, this.player.y + 35);
        
        // 장애물
        this.ctx.fillStyle = '#333';
        this.obstacles.forEach(obs => {
            this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        });
        
        // 아이템
        this.items.forEach(item => {
            if (item.type === 'paper') {
                this.ctx.fillStyle = '#FFD700';
                this.ctx.fillRect(item.x, item.y, item.width, item.height);
                this.ctx.fillStyle = '#000';
                this.ctx.font = '20px Arial';
                this.ctx.fillText('📄', item.x, item.y + 25);
            } else {
                this.ctx.fillStyle = '#FFA500';
                this.ctx.beginPath();
                this.ctx.arc(item.x + 15, item.y + 15, 15, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#000';
                this.ctx.font = '16px Arial';
                this.ctx.fillText('C', item.x + 10, item.y + 20);
            }
        });
        
        // 체력 표시
        this.ctx.fillStyle = '#FF0000';
        this.ctx.font = '20px Arial';
        for (let i = 0; i < this.currentHealth; i++) {
            this.ctx.fillText('❤️', 10 + i * 30, 30);
        }
    }
    
    gameOver() {
        this.state = 'gameover';
        this.totalCoins += this.coins;
        this.saveStats();
        
        document.getElementById('gameUI').classList.add('hidden');
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('earnedCoins').textContent = this.coins;
    }
}

// 게임 시작
const game = new Game();
