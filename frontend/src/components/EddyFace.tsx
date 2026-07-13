interface EddyFaceProps {
  active: boolean
}

export function EddyFace({ active }: EddyFaceProps) {
  return (
    <div className={`eddy-face${active ? ' eddy-face--active' : ''}`}>
      <img className="eddy-face__image" src="/eddy.svg" alt="Eddy" width={180} height={210} />
    </div>
  )
}
