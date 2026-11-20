'use client';

import dynamic from 'next/dynamic';

const StudioScene3D = dynamic(() => import('./StudioScene3D'), {
  ssr: false,
  loading: () => <div className="scene3d-loading">Подготовка объёмной сцены…</div>,
});

type Props = {
  selected: string;
  onSelect: (value: string) => void;
};

export default function StudioSceneLoader(props: Props) {
  return <StudioScene3D {...props} />;
}
