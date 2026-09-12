function startWork1() {
  const dialog = document.getElementById('dialog1');
  const input = document.getElementById('textInput');
  const okBtn = document.getElementById('okWork1');
  const cancelBtn = document.getElementById('cancelWork1');
  const output = document.getElementById('output');
  
  input.value = '';
  dialog.classList.remove('hidden');

  okBtn.addEventListener('click', function () {
    output.textContent = input.value;
    dialog.classList.add('hidden');
  });

  cancelBtn.addEventListener('click', function () {
    dialog.classList.add('hidden');
  });
}
