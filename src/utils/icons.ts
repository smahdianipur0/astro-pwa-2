import deleteSvg from '../icons/delete.svg?raw'
import copiedSvg from '../icons/copied.svg?raw'
import copySvg from '../icons/copy.svg?raw'


function toMaskUrl(svg : string){
	return `url('data:image/svg+xml,${encodeURIComponent(svg)}')`
}

export const icons = {
	delete: toMaskUrl(deleteSvg),
	copied: toMaskUrl(copiedSvg),
	copy: toMaskUrl(copySvg),
} as const

export type IconName = keyof typeof icons