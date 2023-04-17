/* eslint-disable import/no-extraneous-dependencies */
import { Meta } from '@/layouts/Meta';
import dayjs from 'dayjs';

import { initializeApp } from 'firebase/app';
import type { ListResult, StorageReference } from 'firebase/storage';
import { getBlob, getStorage, list, ref } from 'firebase/storage';
import { useEffect, useState } from 'react';

import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import Twemoji from '@/components/Twemoji';

dayjs.extend(LocalizedFormat);

const firebaseConfig = {
  storageBucket: 'athena-x.appspot.com',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Storage and get a reference to the service
const storage = getStorage(app);
const chatLogRef = ref(storage, 'chat_log.json');
const snapshotRef = ref(storage, 'snapshots');

interface ChatLog {
  timestamp: string;
  content: string;
}

type ChatLogArr = Array<ChatLog>;

const Index = () => {
  const [imageList, setImageList] = useState<Array<string>>([]);
  const [chatLog, setChatLog] = useState<ChatLogArr>();
  const [imageIndex, setImageIndex] = useState(0);
  const [resultList, setResultList] = useState<ListResult>();

  const processImages = (itemsList: Array<StorageReference>) => {
    itemsList.forEach((itemRef) => {
      getBlob(itemRef)
        .then((blob) => {
          setImageList((prev) => [...prev, URL.createObjectURL(blob)]);
        })
        .catch((err) => console.error('Error fetching image: ', err));
    });
  };

  const getImageList = async () => {
    const imageResultList = await list(snapshotRef, { maxResults: 4 });
    setResultList(imageResultList);
    if (imageIndex === 0) {
      processImages(imageResultList.items);
    } else if (resultList && resultList.nextPageToken) {
      const moreResultList = await list(snapshotRef, {
        maxResults: 16,
        pageToken: resultList.nextPageToken,
      });
      setResultList(moreResultList);
      processImages(moreResultList.items);
    }
    setImageIndex(imageIndex + 1);
  };

  useEffect(() => {
    // Get chat log
    getBlob(chatLogRef)
      .then((blob) => {
        const reader = new FileReader();
        reader.readAsText(blob);
        reader.onload = () => {
          const text = reader.result as string;
          const chatLogArr = JSON.parse(text) as ChatLogArr;
          setChatLog(chatLogArr.reverse());
        };
      })
      .catch((err) => console.error('Error fetching chat log: ', err));

    // Get image list
    getImageList();
  }, []);

  return (
    <>
      <Meta
        title="Athena"
        description="Athena is a general-purpose AI assistant with vision, voice, and memory capabilities."
      />
      <div className="flex flex-col items-center px-8 py-16 sm:p-16">
        <div>
          <h1 className="text-4xl font-bold">{'Athena'}</h1>
        </div>
        <div className="flex w-full flex-col">
          <h2 className="my-4 text-2xl font-semibold">
            {
              <>
                <Twemoji emoji="👁️" />
                <span>{' This is what I saw'}</span>
              </>
            }
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4">
            {imageList ? (
              imageList.map((image, index) => (
                <div key={index} className="">
                  <img src={image} />
                </div>
              ))
            ) : (
              <p>{'No image log'}</p>
            )}
          </div>
          {imageList && resultList && resultList.nextPageToken && (
            <div className="mt-4 flex justify-center">
              <button
                className="rounded-full bg-gray-200 px-4 py-1 font-medium text-gray-800 hover:bg-gray-300"
                onClick={getImageList}
              >
                {'See more'}
              </button>
            </div>
          )}
        </div>
        <div className="mt-8 flex w-full flex-col">
          <h2 className="my-4 text-2xl font-semibold">
            {
              <>
                <Twemoji emoji="💬" />
                <span>{' This is what I said'}</span>
              </>
            }
          </h2>
          <div className="flex flex-col gap-y-4">
            {chatLog ? (
              chatLog.map((log, index) => (
                <div
                  className="flex flex-col gap-y-2 rounded-xl bg-slate-50 p-4 shadow-sm"
                  key={index}
                >
                  <div>
                    <p className="inline-flex items-center rounded-full bg-blue-200 px-2.5 py-0.5 text-sm font-medium text-blue-800">
                      {dayjs(log.timestamp).format('LLL')}
                    </p>
                  </div>
                  <p>{log.content}</p>
                </div>
              ))
            ) : (
              <p>{'No chat log'}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Index;
