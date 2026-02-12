function elasticCollision(m1, m2, v1, v2) {
    const v1_final = ((m1 - m2) / (m1 + m2)) * v1 + ((2 * m2) / (m1 + m2)) * v2;
    const v2_final = ((2 * m1) / (m1 + m2)) * v1 + ((m2 - m1) / (m1 + m2)) * v2;
    return { v1_final, v2_final };
}

function runSimulation() {
    const m1 = parseFloat(document.getElementById("m1").value);
    const m2 = parseFloat(document.getElementById("m2").value);
    const v1 = parseFloat(document.getElementById("v1").value);
    const v2 = parseFloat(document.getElementById("v2").value);

    const result = elasticCollision(m1, m2, v1, v2);

    document.getElementById("output").innerHTML = `
        <strong>Results:</strong><br>
        v1 final = ${result.v1_final.toFixed(3)}<br>
        v2 final = ${result.v2_final.toFixed(3)}
    `;
}
