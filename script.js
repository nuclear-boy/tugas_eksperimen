// Animation state
let animationId = null;
let isPaused = false;
let startTime = null;
let pausedTime = 0;
let elapsedTime = 0;

// Canvas and context
const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');

// Particle class
class Particle {
    constructor(mass, velocity, color, startX) {
        this.mass = mass;
        this.velocity = velocity;
        this.color = color;
        this.x = startX;
        this.y = canvas.height / 2;
        this.radius = Math.max(10, Math.min(40, Math.sqrt(mass) * 10)); // Radius proportional to mass
        this.trail = []; // For trail effect
    }

    draw() {
        // Draw trail
        if (this.trail.length > 1) {
            ctx.strokeStyle = this.color + '40'; // Semi-transparent
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) {
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }
            ctx.stroke();
        }

        // Draw particle
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw velocity label
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`v=${this.velocity.toFixed(1)}`, this.x, this.y - this.radius - 10);
        ctx.fillText(`m=${this.mass}`, this.x, this.y + this.radius + 15);
    }

    update(dt) {
        // Update trail
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 30) {
            this.trail.shift();
        }

        // Update position
        this.x += this.velocity * dt * 50; // Scale for visual effect
    }

    checkWallCollision() {
        // Left wall
        if (this.x - this.radius <= 0) {
            this.x = this.radius;
            this.velocity = Math.abs(this.velocity);
            return true;
        }
        // Right wall
        if (this.x + this.radius >= canvas.width) {
            this.x = canvas.width - this.radius;
            this.velocity = -Math.abs(this.velocity);
            return true;
        }
        return false;
    }
}

// Simulation state
let particle1 = null;
let particle2 = null;
let hasCollided = false;
let collisionEffect = 0;

// Elastic collision physics
function elasticCollision(m1, m2, v1, v2) {
    const v1_final = ((m1 - m2) * v1 + 2 * m2 * v2) / (m1 + m2);
    const v2_final = ((m2 - m1) * v2 + 2 * m1 * v1) / (m1 + m2);
    return { v1_final, v2_final };
}

// Check collision between particles
function checkParticleCollision() {
    const distance = Math.abs(particle1.x - particle2.x);
    const minDistance = particle1.radius + particle2.radius;

    if (distance <= minDistance && !hasCollided) {
        // Collision detected
        const result = elasticCollision(
            particle1.mass,
            particle2.mass,
            particle1.velocity,
            particle2.velocity
        );

        particle1.velocity = result.v1_final;
        particle2.velocity = result.v2_final;

        // Separate particles to avoid overlap
        const overlap = minDistance - distance;
        const separationRatio = particle1.radius / minDistance;
        
        if (particle1.x < particle2.x) {
            particle1.x -= overlap * separationRatio;
            particle2.x += overlap * (1 - separationRatio);
        } else {
            particle1.x += overlap * separationRatio;
            particle2.x -= overlap * (1 - separationRatio);
        }

        hasCollided = true;
        collisionEffect = 1.0; // Trigger collision effect

        return true;
    } else if (distance > minDistance + 10) {
        // Reset collision flag when particles are far apart
        hasCollided = false;
    }

    return false;
}

// Calculate kinetic energy
function calculateKineticEnergy() {
    const ke1 = 0.5 * particle1.mass * Math.pow(particle1.velocity, 2);
    const ke2 = 0.5 * particle2.mass * Math.pow(particle2.velocity, 2);
    return ke1 + ke2;
}

// Calculate momentum
function calculateMomentum() {
    return particle1.mass * particle1.velocity + particle2.mass * particle2.velocity;
}

// Update real-time display
function updateDisplay() {
    document.getElementById('time').textContent = elapsedTime.toFixed(2);
    document.getElementById('totalKE').textContent = calculateKineticEnergy().toFixed(2);
    document.getElementById('totalMomentum').textContent = calculateMomentum().toFixed(2);
    document.getElementById('v1Current').textContent = particle1.velocity.toFixed(2);
    document.getElementById('v2Current').textContent = particle2.velocity.toFixed(2);
}

// Draw collision effect
function drawCollisionEffect() {
    if (collisionEffect > 0) {
        const midX = (particle1.x + particle2.x) / 2;
        const midY = canvas.height / 2;
        
        // Flash effect
        ctx.fillStyle = `rgba(255, 255, 255, ${collisionEffect * 0.5})`;
        ctx.beginPath();
        ctx.arc(midX, midY, 50 * collisionEffect, 0, Math.PI * 2);
        ctx.fill();

        // Ripple effect
        ctx.strokeStyle = `rgba(0, 195, 255, ${collisionEffect})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(midX, midY, 60 * (1 - collisionEffect), 0, Math.PI * 2);
        ctx.stroke();

        collisionEffect -= 0.02; // Fade out
        if (collisionEffect < 0) collisionEffect = 0;
    }
}

// Draw grid background
function drawGrid() {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // Draw walls
    ctx.strokeStyle = '#00c3ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(canvas.width, 0);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.stroke();
}

// Animation loop
function animate(currentTime) {
    if (!startTime) startTime = currentTime;
    
    if (!isPaused) {
        const deltaTime = (currentTime - startTime - pausedTime) / 1000;
        elapsedTime = deltaTime;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw grid
        drawGrid();

        // Update physics (use fixed timestep for stability)
        const dt = 1 / 60; // 60 FPS
        particle1.update(dt);
        particle2.update(dt);

        // Check collisions
        particle1.checkWallCollision();
        particle2.checkWallCollision();
        checkParticleCollision();

        // Draw collision effect
        drawCollisionEffect();

        // Draw particles
        particle1.draw();
        particle2.draw();

        // Update display
        updateDisplay();
    }

    animationId = requestAnimationFrame(animate);
}

// Start simulation
function runSimulation() {
    // Get input values
    const m1 = parseFloat(document.getElementById('m1').value);
    const m2 = parseFloat(document.getElementById('m2').value);
    const v1 = parseFloat(document.getElementById('v1').value);
    const v2 = parseFloat(document.getElementById('v2').value);

    // Validate inputs
    if (isNaN(m1) || isNaN(m2) || isNaN(v1) || isNaN(v2)) {
        alert('Please enter valid numbers for all fields');
        return;
    }

    if (m1 <= 0 || m2 <= 0) {
        alert('Mass values must be greater than zero');
        return;
    }

    // Reset animation
    if (animationId) {
        cancelAnimationFrame(animationId);
    }

    // Initialize particles
    particle1 = new Particle(m1, v1, '#ff6b6b', 150);
    particle2 = new Particle(m2, v2, '#4ecdc4', canvas.width - 150);

    // Reset state
    hasCollided = false;
    collisionEffect = 0;
    isPaused = false;
    startTime = null;
    pausedTime = 0;
    elapsedTime = 0;

    // Display initial results
    const result = elasticCollision(m1, m2, v1, v2);
    document.getElementById('output').innerHTML = `
        <strong>Calculated Final Velocities:</strong><br>
        v1 final = ${result.v1_final.toFixed(3)} m/s<br>
        v2 final = ${result.v2_final.toFixed(3)} m/s
    `;

    // Start animation
    animationId = requestAnimationFrame(animate);
}

// Pause simulation
function pauseSimulation() {
    if (!particle1 || !particle2) {
        alert('Please start a simulation first');
        return;
    }

    isPaused = !isPaused;
    
    const pauseButton = document.getElementById('pauseButton');
    if (isPaused) {
        pauseButton.textContent = 'Resume';
    } else {
        pauseButton.textContent = 'Pause';
        if (startTime && elapsedTime) {
            pausedTime = performance.now() - startTime - elapsedTime * 1000;
        }
    }
}

// Reset simulation
function resetSimulation() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    particle1 = null;
    particle2 = null;
    hasCollided = false;
    collisionEffect = 0;
    isPaused = false;
    startTime = null;
    pausedTime = 0;
    elapsedTime = 0;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();

    // Reset display
    document.getElementById('time').textContent = '0.00';
    document.getElementById('totalKE').textContent = '0.00';
    document.getElementById('totalMomentum').textContent = '0.00';
    document.getElementById('v1Current').textContent = '0.00';
    document.getElementById('v2Current').textContent = '0.00';
    document.getElementById('output').innerHTML = '';
    document.getElementById('pauseButton').textContent = 'Pause';
}

// Initialize canvas on load
window.addEventListener('load', () => {
    drawGrid();
});
