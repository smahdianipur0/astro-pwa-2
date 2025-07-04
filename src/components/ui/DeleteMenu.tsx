import type { ParentComponent, JSX } from 'solid-js'
import styles from './DeleteMenu.module.css'

interface MenuComponentProps {
  content?: JSX.Element;
}

const DeleteMenu: ParentComponent<MenuComponentProps> = (props) => {
  return (<>
    <div class='not-prose' >
      <details class={styles.details}>
          <summary  class={styles.summary}></summary>
          {props.content}                                                  
      </details> 
    </div>
  </>);
}

export default DeleteMenu