/* =============================================
   KIRIN Birthday Crowdfunding — script.js

   初心者向け：
   変更したいところは、基本的にこの「設定」だけでOKです。
   ============================================= */

/* ===== 設定 ===== */

// 自分のPayPay送金リンクに変更してください
const PAYPAY_URL = "hhttps://qr.paypay.ne.jp/p2p01_Iw2xyAk7lRRpHVdg";

// 管理者ページのパスワード
const ADMIN_PW = "kirin2025";

// 最初に表示するほしいもの
const INITIAL_WISHES = [
  {
    emoji: "✈️",
    name: "旅行資金",
    desc: "次の旅の航空券・ホテル代にします",
    price: 30000
  },
  {
    emoji: "👗",
    name: "かわいい服",
    desc: "誕生日のおでかけ用",
    price: 15000
  },
  {
    emoji: "📚",
    name: "研究・本代",
    desc: "読みたい本を買います",
    price: 10000
  }
];

/* ===== ここから下は、慣れるまでは触らなくてOK ===== */

const WISH_KEY = "kirin_birthday_wishes_v1";
const PLEDGE_KEY = "kirin_birthday_pledges_v1";

let wishes = [];
let pledges = [];
let selectedIdx = 0;
let currentAmt = 1000;
let editMode = false;
let adminOpen = false;
let adminLoggedIn = false;

/* ===== データ読み込み・保存 ===== */

function loadData() {
  try {
    const savedWishes = localStorage.getItem(WISH_KEY);
    wishes = savedWishes ? JSON.parse(savedWishes) : INITIAL_WISHES;
  } catch (error) {
    wishes = INITIAL_WISHES;
  }

  try {
    const savedPledges = localStorage.getItem(PLEDGE_KEY);
    pledges = savedPledges ? JSON.parse(savedPledges) : [];
  } catch (error) {
    pledges = [];
  }

  if (wishes.length === 0) {
    selectedIdx = -1;
  } else if (selectedIdx >= wishes.length) {
    selectedIdx = 0;
  }
}

function saveData() {
  localStorage.setItem(WISH_KEY, JSON.stringify(wishes));
  localStorage.setItem(PLEDGE_KEY, JSON.stringify(pledges));
}

/* ===== 表示用の便利関数 ===== */

function yen(number) {
  return "¥" + Number(number || 0).toLocaleString("ja-JP");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function collectedFor(index) {
  return pledges
    .filter((pledge) => pledge.wishIdx === index)
    .reduce((sum, pledge) => sum + Number(pledge.amt || 0), 0);
}

function percentFor(wish, index) {
  if (!wish.price || wish.price <= 0) return null;

  const percent = Math.round((collectedFor(index) / wish.price) * 100);
  return Math.min(percent, 100);
}

/* ===== ほしいものリスト ===== */

function renderWishes() {
  const wishList = document.getElementById("wishList");
  if (!wishList) return;

  if (wishes.length === 0) {
    wishList.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🎁</span>
        ほしいものを追加してみよう！<br>
        「＋ 追加・編集」から登録できます
      </div>
    `;
    return;
  }

  wishList.innerHTML = wishes
    .map((wish, index) => {
      const percent = percentFor(wish, index);
      const collected = collectedFor(index);
      const isSelected = selectedIdx === index;
      const isComplete = percent !== null && percent >= 100;

      return `
        <article class="wish-card${isSelected ? " selected" : ""}">
          <div class="wish-card-top" onclick="selectWish(${index})">
            <div class="radio-dot">
              <div class="radio-inner"></div>
            </div>

            <div class="wish-emoji">${escapeHtml(wish.emoji || "🎁")}</div>

            <div class="wish-info">
              <div class="wish-name">
                ${escapeHtml(wish.name)}
                ${isComplete ? '<span class="complete-badge">達成！</span>' : ""}
              </div>
              ${wish.desc ? `<div class="wish-desc">${escapeHtml(wish.desc)}</div>` : ""}
            </div>

            <div class="wish-right">
              ${percent !== null ? `<span class="wish-pct">${percent}%</span>` : ""}
              <span class="wish-price">
                ${wish.price > 0 ? "目標 " + yen(wish.price) : "自由"}
              </span>
            </div>

            ${
              editMode
                ? `<button class="del-btn" type="button" onclick="event.stopPropagation(); deleteWish(${index})">×</button>`
                : ""
            }
          </div>

          ${
            wish.price > 0
              ? `
                <div class="progress-wrap">
                  <div class="progress-track">
                    <div class="progress-fill${isComplete ? " full" : ""}" style="width: ${percent}%"></div>
                  </div>
                  <div class="progress-labels">
                    <span class="collected-label">${yen(collected)} 集まった</span>
                    <span>目標 ${yen(wish.price)}</span>
                  </div>
                </div>
              `
              : ""
          }
        </article>
      `;
    })
    .join("");
}

function selectWish(index) {
  if (editMode) return;
  selectedIdx = index;
  renderWishes();
}

function toggleEdit() {
  editMode = !editMode;

  const addForm = document.getElementById("addForm");
  const editToggle = document.getElementById("editToggle");

  addForm.hidden = !editMode;
  editToggle.textContent = editMode ? "✓ 完了" : "＋ 追加・編集";

  renderWishes();
}

function addWish() {
  const emojiInput = document.getElementById("newEmoji");
  const nameInput = document.getElementById("newName");
  const descInput = document.getElementById("newDesc");
  const priceInput = document.getElementById("newPrice");

  const emoji = emojiInput.value.trim() || "🎁";
  const name = nameInput.value.trim();
  const desc = descInput.value.trim();
  const price = Number(priceInput.value) || 0;

  if (!name) {
    alert("アイテム名を入力してください");
    nameInput.focus();
    return;
  }

  wishes.push({ emoji, name, desc, price });

  if (selectedIdx < 0) selectedIdx = 0;

  emojiInput.value = "";
  nameInput.value = "";
  descInput.value = "";
  priceInput.value = "";

  saveData();
  renderWishes();
  renderAdmin();
}

function deleteWish(index) {
  const ok = confirm("このほしいものを削除しますか？関連する支援記録も削除されます。");
  if (!ok) return;

  wishes.splice(index, 1);

  pledges = pledges
    .filter((pledge) => pledge.wishIdx !== index)
    .map((pledge) => {
      if (pledge.wishIdx > index) {
        return { ...pledge, wishIdx: pledge.wishIdx - 1 };
      }
      return pledge;
    });

  if (wishes.length === 0) {
    selectedIdx = -1;
  } else if (selectedIdx >= wishes.length) {
    selectedIdx = wishes.length - 1;
  }

  saveData();
  renderWishes();
  renderAdmin();
}

/* ===== 金額 ===== */

function setChip(amount, element) {
  currentAmt = Number(amount);

  document.querySelectorAll(".chip").forEach((chip) => {
    chip.classList.remove("active");
  });

  element.classList.add("active");

  document.getElementById("amtInput").value = currentAmt;
  updateAmountDisplay();
}

function onAmt() {
  const input = document.getElementById("amtInput");
  currentAmt = Number(input.value) || 0;

  document.querySelectorAll(".chip").forEach((chip) => {
    chip.classList.remove("active");
  });

  updateAmountDisplay();
}

function updateAmountDisplay() {
  const formatted = yen(currentAmt);

  document.getElementById("totalDisp").textContent = formatted;
  document.getElementById("btnLabel").textContent = `${formatted} を贈る`;
  document.getElementById("payBtn").disabled = currentAmt <= 0;
}

/* ===== PayPay ===== */

function doPayPay() {
  if (currentAmt <= 0) return;

  const senderName = document.getElementById("senderName").value.trim() || "匿名";
  const message = document.getElementById("msgInput").value.trim();

  const selectedWish = selectedIdx >= 0 ? wishes[selectedIdx] : null;
  const wishName = selectedWish ? selectedWish.name : "未選択";

  pledges.push({
    name: senderName,
    amt: currentAmt,
    wishIdx: selectedIdx,
    wishName,
    msg: message,
    time: new Date().toLocaleString("ja-JP")
  });

  saveData();

  document.getElementById("main").style.display = "none";
  document.getElementById("thanks").classList.add("show");

  renderWishes();
  renderAdmin();

  setTimeout(() => {
    window.open(PAYPAY_URL, "_blank");
  }, 300);
}

function goBack() {
  document.getElementById("main").style.display = "block";
  document.getElementById("thanks").classList.remove("show");
  renderWishes();
}

/* ===== 管理者ページ ===== */

function toggleAdmin() {
  adminOpen = !adminOpen;

  document.getElementById("main").style.display = adminOpen ? "none" : "block";
  document.getElementById("thanks").classList.remove("show");
  document.getElementById("adminPanel").style.display = adminOpen ? "block" : "none";

  if (adminOpen && adminLoggedIn) {
    renderAdmin();
  }
}

function adminLogin() {
  const input = document.getElementById("pwInput");
  const error = document.getElementById("pwErr");

  if (input.value === ADMIN_PW) {
    adminLoggedIn = true;
    error.textContent = "";

    document.getElementById("adminLogin").style.display = "none";
    document.getElementById("adminDash").hidden = false;

    renderAdmin();
  } else {
    error.textContent = "パスワードが違います";
  }
}

function adminLogout() {
  adminLoggedIn = false;

  document.getElementById("adminDash").hidden = true;
  document.getElementById("adminLogin").style.display = "block";
  document.getElementById("pwInput").value = "";
  document.getElementById("pwErr").textContent = "";
}

function renderAdmin() {
  if (!adminLoggedIn) return;

  const adminSummary = document.getElementById("adminSummary");
  const pledgeList = document.getElementById("pledgeList");

  if (!adminSummary || !pledgeList) return;

  const total = pledges.reduce((sum, pledge) => sum + Number(pledge.amt || 0), 0);

  adminSummary.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">支援者数</div>
      <div class="stat-val">${pledges.length}人</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">合計金額</div>
      <div class="stat-val pink">${yen(total)}</div>
    </div>
  `;

  if (pledges.length === 0) {
    pledgeList.innerHTML = `<div class="no-pledges">まだ支援がありません</div>`;
    return;
  }

  const grouped = {};

  pledges.forEach((pledge, index) => {
    const key = pledge.wishName || "未選択";

    if (!grouped[key]) {
      grouped[key] = [];
    }

    grouped[key].push({ ...pledge, originalIndex: index });
  });

  let html = "";

  Object.entries(grouped).forEach(([wishName, items]) => {
    const subtotal = items.reduce((sum, item) => sum + Number(item.amt || 0), 0);

    html += `
      <div class="wish-group-title">
        ${escapeHtml(wishName)} — 小計 ${yen(subtotal)}
      </div>
    `;

    items.forEach((item) => {
      html += `
        <div class="pledge-item">
          <div class="pledge-top">
            <span class="pledge-name">${escapeHtml(item.name)}</span>
            <span class="pledge-amt">${yen(item.amt)}</span>
          </div>
          <div class="pledge-detail">${escapeHtml(item.time)}</div>
          ${
            item.msg
              ? `<div class="pledge-msg">「${escapeHtml(item.msg)}」</div>`
              : ""
          }
          <button class="pledge-del" type="button" onclick="deletePledge(${item.originalIndex})">× 削除</button>
        </div>
      `;
    });
  });

  pledgeList.innerHTML = html;
}

function deletePledge(index) {
  const ok = confirm("この支援記録を削除しますか？");
  if (!ok) return;

  pledges.splice(index, 1);
  saveData();
  renderAdmin();
  renderWishes();
}

/* ===== 初期化 ===== */

document.addEventListener("DOMContentLoaded", () => {
  loadData();
  renderWishes();
  updateAmountDisplay();
});
