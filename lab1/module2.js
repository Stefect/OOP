function startWork2() {
  const dialog = document.getElementById('dialog2');
  const slider = document.getElementById('scrollBar');
  const sliderValue = document.getElementById('sliderValue');
  const okBtn = document.getElementById('okWork2');
  const cancelBtn = document.getElementById('cancelWork2');
  const output = document.getElementById('output');

  slider.value = 0;
  sliderValue.textContent = `${slider.value}`;
  dialog.classList.remove('hidden');

  slider.oninput = function () {
    sliderValue.textContent = slider.value;
  };

  okBtn.addEventListener('click', function () {
    output.textContent = slider.value;
    dialog.classList.add('hidden');
  });

  cancelBtn.addEventListener('click', function () {
    dialog.classList.add('hidden');
  });
}
