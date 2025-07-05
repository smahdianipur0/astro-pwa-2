import Popover from '@corvu/popover'
import type { ParentComponent, JSX } from 'solid-js'
import styles from './menu.module.css'

interface MenuComponentProps {
  trigger?: JSX.Element;
  content?: JSX.Element;
  offset?: number;
}

const Menu: ParentComponent<MenuComponentProps> = (props) => {
  return (
    <Popover
      floatingOptions={{
        offset: props.offset ?? 13 ,
        flip: true,
        shift: true,
      }}
    >
    <Popover.Trigger class={[styles.trigger, "not-prose"].join(' ')} > {props.trigger}
    </Popover.Trigger>
      <Popover.Content class={[styles.content, "prose"].join(' ')}>
        {props.content}
      </Popover.Content>
    </Popover>
  )
}

export default Menu