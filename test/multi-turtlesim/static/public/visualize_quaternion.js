
let q = [];
let scene, camera, renderer;
let currentPoint, pathLine;
let pathGeometry, pathMaterial;

const container = document.getElementById('robot_display_canvas_container');

// Three.js 초기화
function initThreeJS() {
    // Scene 생성
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // Camera 설정
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 500);
    camera.position.set(1.3, 1.3, 1.3);
    camera.lookAt(0, 0, 0);

    // Renderer 생성
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // 지면 생성
    const groundGeometry = new THREE.PlaneGeometry(4, 4);
    const groundMaterial = new THREE.MeshPhongMaterial({
        color: 0x888888,
        transparent: true,
        opacity: 0.3
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // 수평으로 회전
    ground.position.y = -0.5; // 로봇 아래쪽에 위치
    scene.add(ground);

    // 지면에 격자 패턴 추가
    const gridHelper = new THREE.GridHelper(4, 20, 0x666666, 0x666666);
    gridHelper.position.y = -0.49; // 지면 살짝 위에
    gridHelper.material.opacity = 0.5;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // 로봇 몸체를 나타내는 직육면체 생성
    const robotGeometry = new THREE.BoxGeometry(0.8, 0.3, 0.4); // 길이, 높이, 너비
    const robotMaterial = new THREE.MeshPhongMaterial({ color: 0x0066cc });
    const robotBody = new THREE.Mesh(robotGeometry, robotMaterial);

    // 로봇 직육면체의 모서리 추가 (입체감을 위해)
    const edges = new THREE.EdgesGeometry(robotGeometry);
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x003366, linewidth: 2 });
    const wireframe = new THREE.LineSegments(edges, edgeMaterial);

    // 로봇의 전방 방향을 나타내는 화살표
    const arrowDirection = new THREE.Vector3(1, 0, 0); // 기본 방향 (X축)
    const arrowOrigin = new THREE.Vector3(0.5, 0, 0); // 로봇 앞쪽에서 시작
    const arrowLength = 0.6;
    const arrowColor = 0xff0000;

    const arrowHelper = new THREE.ArrowHelper(arrowDirection, arrowOrigin, arrowLength, arrowColor, arrowLength * 0.2, arrowLength * 0.1);

    // 로봇과 화살표를 그룹으로 묶음
    currentPoint = new THREE.Group();
    currentPoint.add(robotBody);
    currentPoint.add(wireframe);
    currentPoint.add(arrowHelper);

    scene.add(currentPoint);

    // 경로 라인 초기화
    pathGeometry = new THREE.BufferGeometry();
    pathMaterial = new THREE.LineBasicMaterial({ color: 0x0066ff, linewidth: 2 });
    pathLine = new THREE.Line(pathGeometry, pathMaterial);
    scene.add(pathLine);

    // 조명 추가 (모든 방향에서 밝게)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5); // 밝은 전체 조명
    scene.add(ambientLight);

    // Controls (마우스로 회전)
    addMouseControls();

    // 렌더링 시작
    animate();
}

// 마우스 컨트롤 추가
function addMouseControls() {
    let mouseDown = false;
    let mouseX = 0, mouseY = 0;

    renderer.domElement.addEventListener('mousedown', (event) => {
        mouseDown = true;
        mouseX = event.clientX;
        mouseY = event.clientY;
    });

    renderer.domElement.addEventListener('mouseup', () => {
        mouseDown = false;
    });

    renderer.domElement.addEventListener('mousemove', (event) => {
        if (!mouseDown) return;

        const deltaX = event.clientX - mouseX;
        const deltaY = event.clientY - mouseY;

        const spherical = new THREE.Spherical();
        spherical.setFromVector3(camera.position);
        spherical.theta -= deltaX * 0.01;
        spherical.phi += deltaY * 0.01;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

        camera.position.setFromSpherical(spherical);
        camera.lookAt(0, 0, 0);

        mouseX = event.clientX;
        mouseY = event.clientY;
    });
}

// 시각화 업데이트
function updateVisualization() {
    if (q.length === 0) return;

    const latest = q[q.length - 1];

    // Quaternion을 Three.js Quaternion으로 변환
    const threeQuat = new THREE.Quaternion(latest.x, latest.y, latest.z, latest.w);

    // 로봇 그룹에 quaternion 적용
    currentPoint.setRotationFromQuaternion(threeQuat);
}

// 데이터 업데이트 함수
function updateQ(w, x, y, z) {
    const newQ = { w, x, y, z };
    q.push(newQ);
    updateVisualization();

    // 너무 많은 데이터가 쌓이면 오래된 것 제거
    if (q.length > 100) {
        q.shift();
    }
}

// 애니메이션 루프
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// 창 크기 변경 대응
window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});

// 초기화
window.addEventListener('load', () => {
    initThreeJS();
});