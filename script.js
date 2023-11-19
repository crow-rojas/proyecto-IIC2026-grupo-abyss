document.addEventListener("DOMContentLoaded", function() {
    fetch('levels/level_1.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('level_1').innerHTML = data;
        });

    fetch('levels/level_2.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('level_2').innerHTML = data;
        });
});
