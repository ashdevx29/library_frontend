import React, { useState, useEffect } from 'react';
import { getPhotoUrl } from '../../utils/image';

export default function UserAvatar({
  src,
  name = 'User',
  className = 'h-10 w-10 rounded-full object-cover',
  alt = '',
  style = {}
}) {
  const primaryUrl = getPhotoUrl(src, name);
  const fallbackUrl = `https://ui-avatars.com/api/?background=FFF0E6&color=FF6B00&name=${encodeURIComponent(name || 'User')}&size=128`;
  
  const [imgSrc, setImgSrc] = useState(primaryUrl);

  useEffect(() => {
    setImgSrc(getPhotoUrl(src, name));
  }, [src, name]);

  const handleError = () => {
    if (imgSrc !== fallbackUrl) {
      setImgSrc(fallbackUrl);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt || name}
      className={className}
      style={style}
      onError={handleError}
    />
  );
}
