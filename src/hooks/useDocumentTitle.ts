import { useEffect } from 'react';

const SITE_NAME = 'Abu Hurayrah Essentials';

const useDocumentTitle = (title?: string) => {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Islamic Books, Clothing & Essentials`;
  }, [title]);
};

export default useDocumentTitle;
