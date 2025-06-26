import '../../styles/corvu.css'
import Drawer from "@corvu/drawer";
import { type ParentComponent, type JSX } from "solid-js";


interface DrawerComponentProps {
  trigger?: JSX.Element;
  content?: JSX.Element;
}

const DrawerComponent: ParentComponent<DrawerComponentProps> = (props) => {
  return (
    <Drawer breakPoints={[0.70]} velocityFunction={() => 1} side="right">
      {(drawerProps) => (
        <>
          <Drawer.Trigger class='not-prose-button'> {props.trigger}</Drawer.Trigger>
          
          <Drawer.Portal>
            <Drawer.Overlay
              style={{
                'background-color': `rgb(0 0 0 / ${
                  0.5 * drawerProps.openPercentage
                })`,
              }}
            />
            <Drawer.Content>
              <Drawer.Close> 
              <div class='glass' style="position: absolute;
                  inset: 0;
                  z-index: var(--z-layer-middle);
                  display: flex;
                  align-items: center;
                  background: oklch(var(--gray-10) / 50%);
                  border-top-left-radius: var(--radius-a);
                  border-top-right-radius: var(--radius-a);
                  height: var(--size-md3);">
                
                <div style="margin-right: var(--size-sm3); display:flex; width: fit-content; align-items: center;">
                    <svg style="padding: 2px" width="24" height="24" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M15.707 4.293a1 1 0 0 1 0 1.414L9.414 12l6.293 6.293a1 1 0 0 1-1.414 1.414l-7-7a1 1 0 0 1 0-1.414l7-7a1 1 0 0 1 1.414 0Z" fill="oklch(var(--primary))"/></svg>
                    <div style="color:oklch(var(--primary));">back</div>
                </div>
              </div>
              </Drawer.Close>         
              {props.content}
              <Drawer.Description></Drawer.Description>
            </Drawer.Content>
          </Drawer.Portal>
        </>
      )}
    </Drawer>
  )
}

export default DrawerComponent