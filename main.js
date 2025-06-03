const API_KEY = "key_6ed2397f66edbb1bba927b06e94139079c33d19e81b4e0bc755e913455b83a384815eb1ff4f66245902366e530a0f99db833a76119f216ddca06f1df77ebade6";
const imgbbApiKey = "c0e2b4b6f8cb952f80d651affe18eda3";

async function uploadImage() {
  const file = document.getElementById("imageInput").files[0];
  const prompt = document.getElementById("promptInput").value.trim();
  const status = document.getElementById("status");
  const videoDiv = document.getElementById("videoResult");
  const preview = document.getElementById("preview");
  const loader = document.getElementById("loader");

  videoDiv.innerHTML = "";
  preview.innerHTML = "";
  status.textContent = "";
  loader.classList.remove("hidden");

  if (!file) {
    loader.classList.add("hidden");
    return alert("يرجى اختيار صورة واحدة.");
  }

  // معاينة الصورة
  const reader = new FileReader();
  reader.onload = e => {
    const img = document.createElement("img");
    img.src = e.target.result;
    img.className = "w-full rounded shadow";
    preview.appendChild(img);
  };
  reader.readAsDataURL(file);

  try {
    status.textContent = "📤 جاري رفع الصورة إلى imgbb...";

    const formData = new FormData();
    formData.append("image", file);

    const uploadRes = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
      method: "POST",
      body: formData
    });

    const uploadData = await uploadRes.json();
    if (!uploadData.success) {
      status.textContent = "❌ فشل في رفع الصورة.";
      loader.classList.add("hidden");
      return;
    }

    const imageUrl = uploadData.data.url;
    status.textContent = "🚀 جاري إرسال الصورة لـ Runway...";

    const runwayRes = await fetch("https://api.runwayml.com//v1/image_to_video", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "Runway-API-Version": "2024-11-06"
      },
      body: JSON.stringify({
        prompt: prompt || "A cinematic slow motion zoom out", // في حال لم يتم إدخال وصف
        promptImage: [
          {
            uri: imageUrl,
            position: "first"
          }
        ],
        ratio: "1280:768",
        fps: 12
      })
    });

    const runwayData = await runwayRes.json();
    if (!runwayData.id) {
      console.error("📛 رد Runway:", runwayData);
      status.textContent = `❌ فشل إنشاء المهمة: ${runwayData.error?.message || "حدث خطأ."}`;
      loader.classList.add("hidden");
      return;
    }

    const taskId = runwayData.id;
    status.textContent = "⏳ جاري توليد الفيديو...";

    let retries = 20;
    let outputUrl = null;

    while (retries-- > 0) {
      const checkRes = await fetch(`https://api.runwayml.com/v1/tasks/${taskId}`, {
        headers: {
          "Authorization": `Bearer ${API_KEY}`
        }
      });

      const checkData = await checkRes.json();

      if (checkData.status === "SUCCEEDED") {
        outputUrl = checkData.output?.videoUri || checkData.output?.[0];
        break;
      } else if (checkData.status === "FAILED") {
        status.textContent = "❌ فشل في إنشاء الفيديو.";
        loader.classList.add("hidden");
        return;
      }

      await new Promise(r => setTimeout(r, 3000));
    }

    if (outputUrl) {
      status.textContent = "✅ تم إنشاء الفيديو:";
      videoDiv.innerHTML = `
        <video controls class="w-full rounded-md shadow mt-2">
          <source src="${outputUrl}" type="video/mp4">
        </video>
      `;
    } else {
      status.textContent = "⏱️ انتهى الوقت دون الحصول على نتيجة.";
    }
  } catch (err) {
    console.error("حدث خطأ:", err);
    status.textContent = "❌ حدث خطأ أثناء التنفيذ.";
  } finally {
    loader.classList.add("hidden");
  }
}
