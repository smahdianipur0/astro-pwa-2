import '../../styles/corvu.css'
import Popover from '@corvu/popover'
import type { VoidComponent } from 'solid-js'

const Menu: VoidComponent = (props) => {
  return (
    <Popover
      floatingOptions={{
        offset: 13,
        flip: true,
        shift: true,
      }}
    >
      <Popover.Trigger class='not-prose'>
        <div class='text-as-button' style={"margin-right: calc(var(--size-sm0)* -1);"} >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM18 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" fill="oklch(var(--gray-95))"/></svg>
        </div>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content class='prose'>
          {props.children}
        </Popover.Content>
      </Popover.Portal>
    </Popover>
  )
}

export default Menu