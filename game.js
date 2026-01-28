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
        this.gameSpeed = 3 + (this.stats.speed * 0.3);
        this.maxHealth = 100 + (this.stats.health * 10);
        this.currentHealth = this.maxHealth;
        this.isInvincible = false;
        this.invincibleTimer = 0;
        this.damageFlash = false;
        
        // 플레이어 이미지 (로얄티 프리 러너 이미지 URL)
        this.playerImg = new Image();
        this.playerImg.src = 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/javascript/javascript.png';
        
        // 장애물과 아이템
        this.obstacles = [];
        this.items = [];
        this.obstacleTimer = 0;
        this.itemTimer = 0;
        this.backgroundOffset = 0;
        
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
        if (!this.stats) return 'F';
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
        this.maxHealth = 100 + (this.stats.health * 10);
        this.currentHealth = this.maxHealth;
        this.gameSpeed = 3 + (this.stats.speed * 0.3);
        this.obstacles = [];
        this.items = [];
        this.obstacleTimer = 0;
        this.itemTimer = 0;
        this.isInvincible = false;
        this.invincibleTimer = 0;
        this.backgroundOffset = 0;
        
        document.getElementById('mainMenu').classList.add('hidden');
        document.getElementById('gameUI').classList.remove('hidden');
        this.updateHealthBar();
        
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
        
        // 배경 스크롤
        this.backgroundOffset += this.gameSpeed;
        if (this.backgroundOffset > this.canvas.width) {
            this.backgroundOffset = 0;
        }
        
        // 무적 타이머
        if (this.isInvincible) {
            this.invincibleTimer--;
            this.damageFlash = Math.floor(this.invincibleTimer / 5) % 2 === 0;
            if (this.invincibleTimer <= 0) {
                this.isInvincible = false;
                this.damageFlash = false;
            }
        }
        
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
        
        // 장애물 생성 (지상 + 공중)
        this.obstacleTimer++;
        if (this.obstacleTimer > 120) {
            const isAirObstacle = Math.random() > 0.6;
            this.obstacles.push({
                x: this.canvas.width,
                y: isAirObstacle ? this.groundY - 80 : this.groundY + 20,
                width: 40,
                height: isAirObstacle ? 40 : 60,
                type: 'obstacle',
                isAir: isAirObstacle
            });
            this.obstacleTimer = 0;
        }
        
        // 아이템(시험지) 생성
        this.itemTimer++;
        if (this.itemTimer > 100) {
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
            
            if (!this.isInvincible && this.checkCollision(this.player, this.obstacles[i])) {
                this.takeDamage(10);
            }
            
            // 화면 밖으로 나간 장애물만 제거
            if (this.obstacles[i].x + this.obstacles[i].width < -50) {
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
    
    takeDamage(amount) {
        this.currentHealth -= amount;
        this.isInvincible = true;
        this.invincibleTimer = 60; // 1초 무적
        this.updateHealthBar();
        
        if (this.currentHealth <= 0) {
            this.currentHealth = 0;
            this.gameOver();
        }
    }
    
    updateHealthBar() {
        const healthPercent = (this.currentHealth / this.maxHealth) * 100;
        const healthBar = document.getElementById('healthBar');
        const healthText = document.getElementById('healthText');
        
        if (healthBar) {
            healthBar.style.width = healthPercent + '%';
        }
        if (healthText) {
            healthText.textContent = Math.max(0, this.currentHealth) + ' / ' + this.maxHealth;
        }
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    draw() {
        // 하늘 그라데이션 배경
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#E0F6FF');
        gradient.addColorStop(1, '#FFF9E6');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 구름 효과
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        for (let i = 0; i < 3; i++) {
            const cloudX = ((this.backgroundOffset * 0.3) + i * 300) % (this.canvas.width + 200) - 100;
            this.drawCloud(cloudX, 50 + i * 40);
        }
        
        // 땅 (그라데이션)
        const groundGradient = this.ctx.createLinearGradient(0, this.groundY + 80, 0, this.canvas.height);
        groundGradient.addColorStop(0, '#8B7355');
        groundGradient.addColorStop(0.3, '#6B5345');
        groundGradient.addColorStop(1, '#4A3C2F');
        this.ctx.fillStyle = groundGradient;
        this.ctx.fillRect(0, this.groundY + 80, this.canvas.width, 120);
        
        // 땅 위 잔디
        this.ctx.fillStyle = '#7CB342';
        this.ctx.fillRect(0, this.groundY + 75, this.canvas.width, 10);
        
        // 잔디 디테일
        this.ctx.strokeStyle = '#558B2F';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < this.canvas.width; i += 20) {
            const grassX = (i - this.backgroundOffset) % this.canvas.width;
            this.ctx.beginPath();
            this.ctx.moveTo(grassX, this.groundY + 80);
            this.ctx.lineTo(grassX + 3, this.groundY + 70);
            this.ctx.stroke();
        }
        
        // 플레이어 (정태) - 깜빡임 효과
        if (!this.damageFlash) {
            // 그림자
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.beginPath();
            this.ctx.ellipse(this.player.x + 25, this.groundY + 85, 20, 5, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 플레이어 몸체
            this.ctx.fillStyle = '#FF6B6B';
            this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
            
            // 외곽선
            this.ctx.strokeStyle = '#C92A2A';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(this.player.x, this.player.y, this.player.width, this.player.height);
            
            // 얼굴
            this.ctx.fillStyle = '#FFE0B2';
            this.ctx.fillRect(this.player.x + 10, this.player.y + 10, 30, 25);
            
            // 눈
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(this.player.x + 15, this.player.y + 18, 5, 5);
            this.ctx.fillRect(this.player.x + 30, this.player.y + 18, 5, 5);
            
            // 입
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(this.player.x + 25, this.player.y + 25, 5, 0, Math.PI);
            this.ctx.stroke();
            
            // 이름
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = 'bold 12px "Noto Sans KR", Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('정태', this.player.x + 25, this.player.y + 50);
        } else {
            // 피격 시 빨간색/검정색 깜빡임
            const flashColor = Math.floor(this.invincibleTimer / 3) % 2 === 0 ? '#FF0000' : '#000000';
            this.ctx.fillStyle = flashColor;
            this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        }
        
        // 장애물 (더 디테일하게)
        this.obstacles.forEach(obs => {
            if (obs.isAir) {
                // 공중 장애물 (새)
                this.ctx.fillStyle = '#424242';
                this.ctx.beginPath();
                this.ctx.ellipse(obs.x + 20, obs.y + 20, 20, 15, 0, 0, Math.PI * 2);
                this.ctx.fill();
                
                // 날개
                this.ctx.fillStyle = '#616161';
                const wingOffset = Math.sin(Date.now() / 100) * 5;
                this.ctx.beginPath();
                this.ctx.ellipse(obs.x + 5, obs.y + 20, 10, 5, wingOffset, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.ellipse(obs.x + 35, obs.y + 20, 10, 5, -wingOffset, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                // 지상 장애물 (바위)
                const rockGradient = this.ctx.createLinearGradient(obs.x, obs.y, obs.x, obs.y + obs.height);
                rockGradient.addColorStop(0, '#757575');
                rockGradient.addColorStop(0.5, '#616161');
                rockGradient.addColorStop(1, '#424242');
                this.ctx.fillStyle = rockGradient;
                
                // 바위 모양
                this.ctx.beginPath();
                this.ctx.moveTo(obs.x + obs.width / 2, obs.y);
                this.ctx.lineTo(obs.x + obs.width, obs.y + obs.height * 0.7);
                this.ctx.lineTo(obs.x + obs.width * 0.8, obs.y + obs.height);
                this.ctx.lineTo(obs.x + obs.width * 0.2, obs.y + obs.height);
                this.ctx.lineTo(obs.x, obs.y + obs.height * 0.7);
                this.ctx.closePath();
                this.ctx.fill();
                
                // 바위 외곽선
                this.ctx.strokeStyle = '#212121';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                // 바위 디테일
                this.ctx.fillStyle = '#9E9E9E';
                this.ctx.beginPath();
                this.ctx.arc(obs.x + 15, obs.y + 20, 5, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        
        // 아이템 (더 예쁘게)
        this.items.forEach(item => {
            if (item.type === 'paper') {
                // 시험지 (반짝이는 효과)
                const paperGradient = this.ctx.createLinearGradient(item.x, item.y, item.x + item.width, item.y + item.height);
                paperGradient.addColorStop(0, '#FFD700');
                paperGradient.addColorStop(0.5, '#FFF176');
                paperGradient.addColorStop(1, '#FFD700');
                this.ctx.fillStyle = paperGradient;
                this.ctx.fillRect(item.x, item.y, item.width, item.height);
                
                // 외곽선
                this.ctx.strokeStyle = '#F57F17';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(item.x, item.y, item.width, item.height);
                
                // 반짝임 효과
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                const sparkle = Math.sin(Date.now() / 100) * 0.5 + 0.5;
                this.ctx.globalAlpha = sparkle;
                this.ctx.fillRect(item.x + 5, item.y + 5, 5, 5);
                this.ctx.globalAlpha = 1;
                
                // 텍스트
                this.ctx.fillStyle = '#000';
                this.ctx.font = 'bold 20px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('📄', item.x + 15, item.y + 22);
            } else {
                // 코인 (회전 효과)
                const rotation = (Date.now() / 500) % (Math.PI * 2);
                const scale = Math.abs(Math.cos(rotation));
                
                this.ctx.save();
                this.ctx.translate(item.x + 15, item.y + 15);
                this.ctx.scale(scale, 1);
                
                // 코인 그라데이션
                const coinGradient = this.ctx.createRadialGradient(0, 0, 5, 0, 0, 15);
                coinGradient.addColorStop(0, '#FFD700');
                coinGradient.addColorStop(0.5, '#FFA500');
                coinGradient.addColorStop(1, '#FF8C00');
                this.ctx.fillStyle = coinGradient;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 15, 0, Math.PI * 2);
                this.ctx.fill();
                
                // 코인 외곽선
                this.ctx.strokeStyle = '#CC7000';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                // C 문자
                this.ctx.fillStyle = '#FFF';
                this.ctx.font = 'bold 16px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('C', 0, 0);
                
                this.ctx.restore();
            }
        });
    }
    
    drawCloud(x, y) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 20, 0, Math.PI * 2);
        this.ctx.arc(x + 25, y, 25, 0, Math.PI * 2);
        this.ctx.arc(x + 50, y, 20, 0, Math.PI * 2);
        this.ctx.fill();
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
