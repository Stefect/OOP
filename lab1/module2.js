function startWork2() {
  const dialog = document.getElementById('dialog2');
  const input = document.getElementById('textInput');
  const okBtn = document.getElementById('okWork2');
  const cancelBtn = document.getElementById('cancelWork2');
  const output = document.getElementById('output');

  input.value = '';
  dialog.classList.remove('hidden');

  okBtn.onclick = function () {
    output.textContent = input.value;
    dialog.classList.add('hidden');
  };

  cancelBtn.onclick = function () {
    dialog.classList.add('hidden');
  };
}
