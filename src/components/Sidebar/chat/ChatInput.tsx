import { useEffect, useState } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import { GiMagicBroom } from 'react-icons/gi'
import { IoSend } from 'react-icons/io5'
import { HiHand } from 'react-icons/hi'
import ChatHistory from './ChatHistory'
import { useChatHistory } from '../../../hooks/useChatHistory'
import WebPageContentToggle from './WebPageContentToggle'
import ImageCaptureButton from './ImageCaptureButton'
import {
  type MessageDraft,
  useMessageDraft,
} from '../../../hooks/useMessageDraft'
import FilePreviewBar from './FilePreviewBar'
import ChangeChatModel from './ChangeChatModel'
import InsertPromptToDraftButton from './InsertPromptToDraftButton'

interface SidebarInputProps {
  loading: boolean
  submitMessage: (message: MessageDraft, context?: string) => void
  clearMessages: () => void
  chatIsEmpty: boolean
  cancelRequest: () => void
  isWebpageContextOn: boolean
  isVisionModel: boolean
}

const MAX_MESSAGE_LENGTH = 10000

export function SidebarInput({
  loading,
  submitMessage,
  clearMessages,
  chatIsEmpty,
  cancelRequest,
  isWebpageContextOn,
  isVisionModel,
}: SidebarInputProps) {
  const {
    messageDraft,
    setMessageDraftText,
    resetMessageDraft,
    addMessageDraftFile,
    removeMessageDraftFile,
  } = useMessageDraft()
  const [delayedLoading, setDelayedLoading] = useState(false)
  const { history } = useChatHistory()

  useEffect(() => {
    const handleLoadingTimeout = setTimeout(() => {
      setDelayedLoading(loading)
    }, 1000)
    return () => {
      clearTimeout(handleLoadingTimeout)
    }
  }, [loading])

  const handleSubmit = async () => {
    let context: string | undefined
    if (isWebpageContextOn) {
      const pageContent = new Promise((resolve) => {
        window.addEventListener('message', (event) => {
          const { action, payload } = event.data
          if (action === 'get-page-content') {
            resolve(payload)
          }
        })

        window.parent.postMessage({ action: 'get-page-content' }, '*')
      })
      context = (await pageContent) as string
    }
    submitMessage(messageDraft, isWebpageContextOn ? context : undefined)
    resetMessageDraft()
  }

  const handlePodCast = async () => {
    let context: string | undefined;
    if (isWebpageContextOn) {
      const pageContent = new Promise((resolve) => {
        window.addEventListener('message', (event) => {
          const { action, payload } = event.data;
          if (action === 'get-page-content') {
            resolve(payload);
          }
        });

        window.parent.postMessage({ action: 'get-page-content' }, '*');
      });
      context = (await pageContent) as string;
    }

    if (!context) {
      console.error("No context found.  Cannot generate podcast.");
      return; 
    }

    try {
      const transcriptInput = {
        text: context, 
        image_urls: [], 
        source_urls: [], 
        config: {
          word_count: 100,
          conversation_style: ["Vui vẻ", "Giàu hình ảnh", "Dễ hiểu"],
          roles_person1: "Giáo viên thân thiện",
          roles_person2: "Học sinh tò mò",
          dialogue_structure: ["Chào hỏi", "Giới thiệu chủ đề", "Giải thích khái niệm", "Câu hỏi tương tác", "Kết thúc bằng bài hát hoặc trò chơi"],
          podcast_name: "Học cùng Sao Khuê",
          podcast_tagline: "Khơi dậy tri thức – Nuôi dưỡng tò mò!",
          output_language: "Vietnamese",
          user_instructions: "Sử dụng từ đơn giản, kể chuyện sinh động, gần gũi với lứa tuổi học sinh tiểu học.",
          engagement_techniques: ["Âm thanh vui nhộn", "Câu hỏi tương tác", "So sánh hài hước", "Câu chuyện ngắn"],
          creativity: 0.3,
          max_num_chunks: 5,
          min_chunk_size: 400
        }
      };
      console.log(transcriptInput)

      // 1. Generate Transcript
      const transcriptResponse = await fetch('http://127.0.0.1:8000/api/transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transcriptInput),
        // No parameters needed for /api/transcript according to the spec.
        // If it requires input, you need to provide it here.
      });

      if (!transcriptResponse.ok) {
        console.error("Error generating transcript:", transcriptResponse.status, await transcriptResponse.json());
        return;
      }

      const transcriptData = await transcriptResponse.json();
      console.log("Transcript Data:", transcriptData); // Log the transcript data
      const transcript = transcriptData.transcript;


      const audioInput = {
          transcript: transcript,
          voice_map: {
              "1": "vi-VN-HoaiMyNeural"
              "2": "vi-VN-NamMinhNeural",
          }
      }

      const audioResponse = await fetch('http://127.0.0.1:8000/api/audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(audioInput),
      });

      if (!audioResponse.ok) {
        console.error("Error generating audio:", audioResponse.status, await audioResponse.json());
        return;
      }

      const audioData = await audioResponse.json();
      console.log("Audio Data:", audioData);
      const audioUrl = audioData.audioUrl; // Assuming the response contains 'audioUrl'

      // 3. Return the Audio URL
      // You'll need to update your UI to display or play the audio.
      console.log("Podcast Audio URL:", audioUrl);
      return audioUrl;  // or set state variable and render in UI
    } catch (error) {
      console.error("Error generating podcast:", error);
      // Handle the error (e.g., display an error message to the user)
      return null;  // Or return an appropriate error value.
    }
  };

  const sendButton = (
    <button
      type="button"
      disabled={loading}
      onClick={handleSubmit}
      className="cdx-flex cdx-gap-2 disabled:cdx-bg-slate-500 disabled:cdx-text-slate-400 cdx-items-center cdx-bg-blue-500 hover:cdx-bg-blue-700 cdx-text-white cdx-py-2 cdx-px-4 cdx-rounded"
    >
      <span>Send</span> <IoSend size={10} />
    </button>
  )

  const stopButton = (
    <button
      type="button"
      onClick={cancelRequest}
      className="cdx-flex cdx-gap-2 disabled:cdx-bg-slate-500 disabled:cdx-text-slate-400 cdx-items-center cdx-bg-red-500 hover:cdx-bg-red-700 cdx-text-white cdx-py-2 cdx-px-4 cdx-rounded"
    >
      <HiHand size={18} /> <span>Stop</span>
    </button>
  )

  return (
    <div className="cdx-fixed cdx-bottom-0 cdx-left-0 cdx-right-0 cdx-flex cdx-flex-col ">
      <div className="cdx-flex cdx-mx-3 cdx-items-center cdx-justify-between">
        {!chatIsEmpty ? (
          <button
            type="button"
            onClick={clearMessages}
            className="cdx-rounded-full cdx-h-8 cdx-w-8 cdx-grid cdx-place-items-center cdx-text-center cdx-bg-blue-500 hover:cdx-bg-blue-700 cdx-text-white"
          >
            <GiMagicBroom size={16} className="mx-auto" />
          </button>
        ) : (
          <div />
        )}
        <div className="cdx-flex cdx-gap-2">
          {(history.length || !chatIsEmpty) && <ChatHistory />}
        </div>
      </div>

      <div className="cdx-m-2 cdx-rounded-md cdx-border dark:cdx-border-neutral-800 cdx-border-neutral-300 dark:cdx-bg-neutral-900/90 cdx-bg-neutral-200/90 focus:cdx-outline-none focus:cdx-ring-2 focus:cdx-ring-blue-900 focus:cdx-ring-opacity-50">
        {messageDraft.files.length > 0 && (
          <FilePreviewBar
            files={messageDraft.files}
            removeFile={removeMessageDraftFile}
          />
        )}
        <TextareaAutosize
          minRows={2}
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder="Type your message here..."
          value={messageDraft.text}
          disabled={loading}
          className="cdx-p-3 cdx-w-full focus:!cdx-outline-none placeholder:cdx-text-neutral-500 cdx-text-sm cdx-resize-none cdx-max-h-96 cdx-pb-0 cdx-bg-transparent !cdx-border-none"
          onChange={(e) => {
            e.preventDefault()
            setMessageDraftText(e.target.value)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit()
            }
          }}
        />
        <div className="cdx-flex cdx-justify-between cdx-items-center cdx-p-3">
          <div className="cdx-flex cdx-gap-2">
            {isVisionModel && (
              <ImageCaptureButton addMessageDraftFile={addMessageDraftFile} />
            )}
          </div>
          <div className="cdx-flex cdx-gap-2">
              <button 
              type="button"
              disabled={loading}
              onClick={handlePodCast}>
                  podcast
              </button>
          </div>
          <div className="cdx-flex cdx-items-center cdx-justify-center cdx-gap-4">
            <WebPageContentToggle />
            {!delayedLoading ? sendButton : stopButton}
          </div>
        </div>
      </div>
    </div>
  )
}
