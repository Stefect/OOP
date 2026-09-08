const groups = ['ІМ-51', 'ІМ-52', 'ІМ-53', 'ІМ-54', 'ІМ-55'];

function startWork1() {
  const dialog = document.getElementById('dialog1');
  const list = document.getElementById('groupList');
  const okBtn = document.getElementById('okWork1');
  const cancelBtn = document.getElementById('cancelWork1');
  const output = document.getElementById('output');

  list.innerHTML = '';
  for (const group of groups) {
    const option = document.createElement('option');
    option.textContent = group;
    list.appendChild(option);
  }

  dialog.classList.remove('hidden');

  okBtn.onclick = function () {
    output.textContent = list.value;
    dialog.classList.add('hidden');
  };

  cancelBtn.onclick = function () {
    dialog.classList.add('hidden');
  };
}
