import React, { useState } from 'react';
import type { Settings } from '../../../config/settings'

const defaultConfig = {
  word_count: 100,
  conversation_style: "Vui vẻ,Giàu hình ảnh,Dễ hiểu",
  roles_person1: "Giáo viên thân thiện",
  roles_person2: "Học sinh tò mò",
  dialogue_structure: "Chào hỏi,Giới thiệu chủ đề,Giải thích khái niệm,Câu hỏi tương tác,Kết thúc bằng bài hát hoặc trò chơi",
  podcast_name: "Học cùng Sao Khuê",
  podcast_tagline: "Khơi dậy tri thức – Nuôi dưỡng tò mò!",
  output_language: "Vietnamese",
  user_instructions: "Sử dụng từ đơn giản, kể chuyện sinh động, gần gũi với lứa tuổi học sinh tiểu học.",
  engagement_techniques: "Âm thanh vui nhộn,Câu hỏi tương tác,So sánh hài hước,Câu chuyện ngắn",
  creativity: 0.3,
  max_num_chunks: 5,
  min_chunk_size: 400,
};

const textFields = [
  { label: "Tên Podcast", key: "podcast_name" },
  { label: "Slogan của Podcast", key: "podcast_tagline" },
  { label: "Vai trò - Nhân vật 1", key: "roles_person1" },
  { label: "Vai trò - Nhân vật 2", key: "roles_person2" },
  { label: "Phong cách hội thoại (phân tách bằng dấu phẩy)", key: "conversation_style" },
  { label: "Cấu trúc hội thoại (phân tách bằng dấu phẩy)", key: "dialogue_structure" },
  { label: "Kỹ thuật thu hút (phân tách bằng dấu phẩy)", key: "engagement_techniques" },
  { label: "Yêu cầu", key: "user_instructions" },
  { label: "Ngôn ngữ đầu ra", key: "output_language" },
];

interface PodcastProps {
  settings: Settings
}

const Podcast = ({settings}: PodcastProps) => {
  const [config, setConfig] = useState(defaultConfig);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transcriptData, setTranscriptData] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);

  const handleInputChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const getContext = () =>
    new Promise((resolve, reject) => {
      if (!settings.general.webpageContext) return resolve('Nội dung mẫu để thử nghiệm...');
      window.addEventListener('message', (event) => {
        if (event.data?.action === 'get-page-content') {
          resolve(event.data.payload);
        }
      });
      window.parent.postMessage({ action: 'get-page-content' }, '*');
      setTimeout(() => reject("Hết thời gian khi lấy nội dung trang"), 3000);
    });

  const handleGenerateTranscript = async () => {
    setLoading(true);
    setError(null);
    setTranscriptData(null);
    setAudioUrl(null);

    try {
      const context = await getContext();
      if (!context) throw new Error("Không có nội dung để tạo podcast.");

      const preparedConfig = {
        ...config,
        conversation_style: config.conversation_style.split(',').map(s => s.trim()),
        dialogue_structure: config.dialogue_structure.split(',').map(s => s.trim()),
        engagement_techniques: config.engagement_techniques.split(',').map(s => s.trim()),
      };

      const response = await fetch('http://127.0.0.1:8000/api/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: context, image_urls: [], source_urls: [], config: preparedConfig }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err?.detail?.[0]?.msg || 'Tạo bản ghi thất bại');
      }

      const data = await response.json();
      setTranscriptData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!transcriptData?.transcript) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcriptData.transcript,
          voice_map: {
            "1": "vi-VN-HoaiMyNeural",
            "2": "vi-VN-NamMinhNeural",
          }
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err?.detail?.[0]?.msg || 'Tạo âm thanh thất bại');
      }

      const data = await response.json();
      setAudioUrl(data.audio_url);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = (content: string) => {
    window.parent.postMessage(
      {
        action: 'copy-to-clipboard',
        _payload: { content },
      },
      '*',
    )
  }

  return (
    <div className="cdx-mx-2 cdx-overflow-y-auto">
      <div className="cdx-space-y-4">
        {textFields.map(({ label, key }) => (
          <div key={key}>
            <label className="cdx-block cdx-font-medium">{label}</label>
            <input
              className="cdx-w-full cdx-border cdx-p-2 cdx-rounded"
              value={config[key]}
              onChange={(e) => handleInputChange(key, e.target.value)}
            />
          </div>
        ))}
        <div>
          <label className="cdx-block cdx-font-medium">Số lượng từ</label>
          <input
            type="number"
            className="cdx-w-full cdx-border cdx-p-2 cdx-rounded"
            value={config.word_count}
            onChange={(e) => handleInputChange("word_count", Number(e.target.value))}
          />
        </div>
      </div>

      <div className="cdx-mt-6">
        <button
          className="cdx-bg-green-600 hover:cdx-bg-green-700 cdx-text-white cdx-px-4 cdx-py-2 cdx-rounded"
          onClick={handleGenerateTranscript}
          disabled={loading}
        >
          {loading ? "Đang xử lý..." : "Tạo kịch bản"}
        </button>
      </div>

      {error && <div className="cdx-text-red-500 cdx-mt-4">⚠ {error}</div>}

      {transcriptData && (
        <div className="cdx-mt-6 cdx-space-y-4">
          <h3 className="cdx-text-lg cdx-font-semibold">Chỉnh sửa bản ghi</h3>
          {transcriptData.transcript.map((line, idx) => (
            <div key={line.id}>
              <label className="cdx-block cdx-font-medium">Người nói {line.speaker_id}</label>
              <textarea
                className="cdx-w-full cdx-border cdx-p-2 cdx-rounded cdx-min-h-[60px]"
                value={line.text}
                onChange={(e) => {
                  const updated = [...transcriptData.transcript];
                  updated[idx].text = e.target.value;
                  setTranscriptData({ ...transcriptData, transcript: updated });
                }}
              />
            </div>
          ))}

          <button
            className="cdx-bg-blue-600 hover:cdx-bg-blue-700 cdx-text-white cdx-px-4 cdx-py-2 cdx-rounded"
            onClick={handleGenerateAudio}
            disabled={loading}
          >
            {loading ? "Đang xử lý..." : "Tạo âm thanh"}
          </button>
        </div>
      )}

      {audioUrl && (
        <div className="cdx-mt-6">
          <h3 className="cdx-text-lg cdx-font-semibold">Podcast audio</h3>
          <audio controls src={audioUrl} className="cdx-w-full cdx-mt-2" />
          <button
            className="cdx-mt-4 cdx-bg-orange-500 hover:cdx-bg-orange-600 cdx-text-white cdx-px-4 cdx-py-2 cdx-rounded"
            onClick={() => {
              handleCopyMessage(audioUrl)
              alert("Đã sao chép đường dẫn âm thanh!");
            }}
          >
            Chia sẻ
          </button>
        </div>
      )}
    </div>
  );
};

export default Podcast;

