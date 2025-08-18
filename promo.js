const container = document.querySelector('.logo-container');
let floatingLogos = [];

async function loadLogos() {
    const sources = ["teams.json", "europa.json", "conference.json"];
    let allLogos = [];

    // Load all logos from all files
    for (const src of sources) {
        const res = await fetch(src);
        const data = await res.json();
        allLogos = allLogos.concat(data);
    }

    createFloatingLogos(allLogos);
}

function createFloatingLogos(logos) {
    logos.forEach(logoObj => {
        const img = document.createElement('img');
        img.src = `img/logos/${logoObj.logo}`;
        img.classList.add('logo');

        const size = 40 + Math.random() * 60;
        img.style.width = `${size}px`;

        // Random start position
        let x = Math.random() * (window.innerWidth - size);
        let y = Math.random() * (window.innerHeight - size);

        // 🔹 Reduced speed (-0.4 to 0.4 px per frame)
        let dx = (Math.random() - 0.5) * 0.8;
        let dy = (Math.random() - 0.5) * 0.8;

        container.appendChild(img);
        floatingLogos.push({ img, x, y, dx, dy, size });
    });

    animateLogos();
}

function animateLogos() {
    floatingLogos.forEach(logo => {
        logo.x += logo.dx;
        logo.y += logo.dy;

        // Bounce horizontally
        if (logo.x <= 0 || logo.x + logo.size >= window.innerWidth) {
            logo.dx *= -1;
        }

        // Bounce vertically
        if (logo.y <= 0 || logo.y + logo.size >= window.innerHeight) {
            logo.dy *= -1;
        }

        logo.img.style.transform = `translate(${logo.x}px, ${logo.y}px)`;
    });

    requestAnimationFrame(animateLogos);
}

loadLogos();
