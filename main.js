<!DOCTYPE html>
<html lang="ar">
<head>
  <meta charset="UTF-8">
  <title>🎥 AI Video Generator</title>
  <style>
    body {
      font-family: sans-serif;
      text-align: center;
      padding: 40px;
      background: #f9f9f9;
    }
    input, button {
      margin: 10px;
    }
    video {
      margin-top: 20px;
      max-width: 100%;
    }
  </style>
</head>
<body>

  <h1>🎥 مولد فيديو من الصور</h1>
  <input type="file" id="imageInput" accept="image/*">
  <br>
  <button onclick="generateVideo()">⚙️ إنشاء الفيديو</button>
  <p id="status">👈 اختر صورة أولاً</p>
  <video id="resultVideo" controls style="display:none;"></video>

  <script>
    const API_KEY = 'YOUR_API_KEY';
    const ENDPOINT = 'https://api.runwayml.com/v1/inference/YOUR_MODEL_ID'; // مثال: gen2-image-to-video

    async function generateVideo() {
      const input = document.getElementById('imageInput');
      const status = document.getElementById('status');
      const video = document.getElementById('resultVideo');
      video.style.display = 'none';

      if (!input.files.length) {
        status.textContent = '❗ الرجاء اختيار صورة أولاً';
        return;
      }

      status.textContent = '📤 جاري رفع الصورة...';

      const formData = new FormData();
      formData.append('image', input.files[0]);

      try {
        // الخطوة 1: إرسال الصورة إلى Runway
        const postRes = await fetch(ENDPOINT, {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + API_KEY
          },
          body: formData
        });

        const postResult = await postRes.json();

        if (!postResult.id) {
          status.textContent = '❌ فشل في إرسال الصورة.';
          return;
        }

        const taskId = postResult.id;
        status.textContent = '⏳ جاري توليد الفيديو...';

        // الخطوة 2: فحص حالة المهمة كل 3 ثواني
        let retries = 20;
        let outputUrl = null;

        while (retries-- > 0) {
          const taskRes = await fetch(`https://api.runwayml.com/v1/tasks/${taskId}`, {
            headers: {
              Authorization: 'Bearer ' + API_KEY
            }
          });

          const taskData = await taskRes.json();

          if (taskData.status === 'SUCCEEDED') {
            outputUrl = taskData.output[0];
            break;
          } else if (taskData.status === 'FAILED') {
            status.textContent = '❌ فشل في إنشاء الفيديو.';
            return;
          }

          await new Promise(res => setTimeout(res, 3000)); // انتظار 3 ثوانٍ
        }

        if (outputUrl) {
          status.textContent = '✅ تم إنشاء الفيديو بنجاح!';
          video.src = outputUrl;
          video.style.display = 'block';
        } else {
          status.textContent = '⏱️ انتهى الوقت دون استجابة.';
        }

      } catch (err) {
        console.error(err);
        status.textContent = '❌ حدث خطأ أثناء الاتصال بـ API.';
      }
    }
  </script>

</body>
</html>
