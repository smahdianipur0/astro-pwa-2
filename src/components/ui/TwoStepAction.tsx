import type { ParentComponent } from 'solid-js'
import styles from './twoStepAction.module.css'
import {icons, type IconName} from '../../utils/icons'

interface TwoStepActionProps {
  color?: string;
  icon?: IconName;
  action?: string;
}

const TwoStepAction: ParentComponent<TwoStepActionProps> = (props) => {
  const iconUrl = () => (props.icon ? icons[props.icon] : 'none');
  return (
    <div class='HStack not-prose'>
      <details style={`color: oklch(${props.color})`} class={styles.details} >
        <summary style={`--icon-url: ${iconUrl()}; --icon-color: oklch(${props.color})`}
          class={styles.summary}
          data-icon={props.icon}
          data-action={props.action}
        />
        {props.children}
      </details>
    </div>
  );
}

export default TwoStepAction
