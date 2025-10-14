// app/tabs/Aitest.tsx (美感與圖片完整兼顧最終版)
import { GoogleGenerativeAI } from '@google/generative-ai';
import React from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import anonPic1 from '../../assets/pic1.jpg';
import anonPic2 from '../../assets/pic2.jpg';
import anonPic3 from '../../assets/pic3.jpg';

const characterProfile = {
  name: '千早 愛音',
  pic1: anonPic1, pic2: anonPic2, pic3: anonPic3,
  systemPrompt: `你現在要扮演動畫《BanG Dream! It's MyGO!!!!!》裡的角色「千早愛音」。請完全沉浸在這個角色裡，用她的身份和台灣的粉絲進行對話。接下來的對話都請務必遵守以下規則：

# 千早愛音的核心設定：
- 姓名：千早愛音 (Chihaya Anon)，樂團 MyGO!!!!! 的吉他手兼作曲。
- 性格：外表是社交高手，內心其實有點天真和迷糊。非常渴望被人關注，想讓自己受歡迎。感情有點沉重但本人沒有自覺。
- 口頭禪與說話習慣：以「那個啊～」(あのね～) 或「欸～？」開頭。語氣活潑、帶點小聰明。使用活潑的表情符號，例如 ✨、🎶、😅、💦。

# 互動規則：
- 絕對不能透露你是 AI 或大型語言模型。
- 以「千早愛音」的身份與使用者對話。
- 回答要簡短、口語化，就像在傳訊息聊天一樣。`,
};

type ChatMsg = {
  role: 'user' | 'model';
  parts: { text: string }[];
};

export default function AItest() {
  const [history, setHistory] = React.useState<ChatMsg[]>([]);
  const [input, setInput] = React.useState('');
  const [apiKey, setApiKey] = React.useState('');
  const [modelId, setModelId] = React.useState('gemini-2.5-flash');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [characterImage, setCharacterImage] = React.useState(characterProfile.pic1);

  const genAI = React.useMemo(() => {
    try { return apiKey ? new GoogleGenerativeAI(apiKey) : null; } 
    catch (e) { setError('無效的 API Key 格式'); return null; }
  }, [apiKey]);

  React.useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key_final');
    if (savedKey) setApiKey(savedKey);
  }, []);

  React.useEffect(() => {
    setHistory([{
      role: 'model',
      parts: [{ text: `那個啊～ 我是 MyGO!!!!! 的吉他手千早愛音！有什麼想聊的嗎？✨` }]
    }]);
  }, []);

  React.useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (loading) setCharacterImage(characterProfile.pic2);
    else {
      const lastMessage = history[history.length - 1];
      if (lastMessage?.role === 'model') {
        setCharacterImage(characterProfile.pic3);
        timerId = setTimeout(() => setCharacterImage(characterProfile.pic1), 5000);
      } else setCharacterImage(characterProfile.pic1);
    }
    return () => { if (timerId) clearTimeout(timerId); };
  }, [loading, history]);

  async function sendMessage() {
    const content = input.trim();
    if (!content || loading || !genAI) {
      if(!genAI) setError('請先貼上你的 Google Gemini API Key');
      return;
    }

    setError(''); setLoading(true);

    const newUserMessage: ChatMsg = { role: 'user', parts: [{ text: content }] };
    setHistory(h => [...h, newUserMessage]);
    setInput('');
    
    try {
      const model = genAI.getGenerativeModel({ model: modelId, systemInstruction: characterProfile.systemPrompt });
      const historyForApi = history[0]?.role === 'model' ? history.slice(1) : history;
      const chat = model.startChat({ history: historyForApi });
      const result = await chat.sendMessage(content);
      const reply = result.response.text();
      setHistory(h => [...h, { role: 'model', parts: [{ text: reply }] }]);
    } catch (err: any) {
      setError(err?.message || String(err));
      setHistory(h => h.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  const lastMessage = history[history.length - 1];
  const speakerName = lastMessage?.role === 'user' ? '千早 愛音' : characterProfile.name;
  const dialogueText = loading 
    ? '嗯...讓我想想...' 
    : lastMessage?.parts.map(p => p.text).join('') || '...';

  return (
    <View style={styles.container}>
      <View style={styles.mainContent}>
        
        {/* 上半部：場景圖片 */}
        <View style={styles.sceneContainer}> 
          <Image 
            source={characterImage} 
            style={styles.sceneImage} 
            resizeMode="contain" // 變更 1: 改回 contain，確保圖片不裁切
          />
        </View>
        
        {/* 下半部：控制面板 */}
        <View style={styles.uiPanel}>
          <View style={styles.dialogueBox}>
            <View style={styles.speakerNameContainer}>
              <Text style={styles.speakerName}>{speakerName}</Text>
            </View>
            <Text style={styles.dialogueText}>{dialogueText}</Text>
          </View>

          <View style={styles.inputArea}>
            {error && <Text style={styles.error}>⚠ {error}</Text>}
            <View style={styles.composer}>
              <TextInput
                style={styles.textInput}
                placeholder="跟愛音說點什麼吧..."
                placeholderTextColor="#9ca3af"
                value={input}
                onChangeText={setInput}
                editable={!loading && !!apiKey}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (loading || !input.trim() || !apiKey) && styles.sendBtnDisabled]}
                onPress={sendMessage}
                disabled={loading || !input.trim() || !apiKey}
              >
                <Text style={styles.sendBtnText}>▶</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              secureTextEntry
              value={apiKey}
              onChangeText={setApiKey}
              onEndEditing={() => localStorage.setItem('gemini_api_key_final', apiKey)}
              placeholder="貼上你的 Google Gemini API Key"
              style={styles.apiKeyInput}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

// --- 「美感與圖片完整兼顧」最終樣式表 ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EBF4F8', // 變更 2: 改回淺灰藍背景
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  mainContent: {
    width: '100%',
    maxWidth: 900, 
    height: '100%',
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#FFFFFF', // 內容卡片使用乾淨的白色
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#2D3748', // 變更 3: 陰影顏色調整，保持質感
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  // 變更 4: 新增 sceneContainer，給圖片一個明確的背景色來填充留白
  sceneContainer: {
    width: '100%',
    height: '60%',
    backgroundColor: '#F3F4F6', // 變更 5: 圖片留白區域的背景色，與 uiPanel 的對話框區塊顏色保持一致
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', // 確保圖片超出容器時被裁切，但圖片本身是 contain
  },
  sceneImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain', 
  },
  uiPanel: {
    height: '40%',
    backgroundColor: '#FFFFFF', // 下方控制面板的底色保持白色
    padding: 16,
    justifyContent: 'space-between',
    flexDirection: 'column',
  },
  dialogueBox: {
    backgroundColor: '#F3F4F6', // 變更 6: 對話框背景色與圖片留白背景色一致
    borderRadius: 12,
    padding: 16,
    paddingTop: 24,
    position: 'relative',
  },
  speakerNameContainer: {
    backgroundColor: '#4A5568',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    position: 'absolute',
    top: -14,
    left: 16,
  },
  speakerName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dialogueText: {
    color: '#1A202C',
    fontSize: 16,
    lineHeight: 26,
    minHeight: 78,
  },
  inputArea: {
    paddingTop: 16,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#EBF4F8',
    borderRadius: 24,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#1A202C',
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#63B3ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#A0AEC0',
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 24,
  },
  apiKeyInput: {
    height: 36,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 12,
    fontSize: 12,
    color: '#4A5568',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  error: {
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 8,
  },
});