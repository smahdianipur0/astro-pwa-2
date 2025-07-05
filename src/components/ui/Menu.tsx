import '../../styles/corvu.css'
import Popover from '@corvu/popover'
import type { ParentComponent, JSX } from 'solid-js'

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
    <Popover.Trigger class='not-prose'> {props.trigger}
    </Popover.Trigger>
      <Popover.Content class='prose'>
        {props.content}
      </Popover.Content>
    </Popover>
  )
}

export default Menu