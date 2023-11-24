document.addEventListener("DOMContentLoaded", function() {
    for (let i = 1; i <= 3; i++) {
        fetch(`levels/level_${i}.html`)
            .then(response => response.text())
            .then(data => {
                document.getElementById(`level_${i}`).innerHTML = data;
            });
    }
});
