import '../styles/drawer.css'
import Drawer from '@corvu/drawer'
import type { ParentComponent } from 'solid-js'

const DrawerComponent: ParentComponent = (props) => {
  return (
    <Drawer breakPoints={[0.70]} velocityFunction={() => 1} side="right">
      {(drawerProps) => (
        <>
          <Drawer.Trigger> 
            <div style="
            display:flex ;
            place-content: space-between;
            padding: var(--default-padding);">
                <div>Recently Deleted</div>
                <svg style="padding: 2px" width="24" height="24" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M8.293 4.293a1 1 0 0 0 0 1.414L14.586 12l-6.293 6.293a1 1 0 1 0 1.414 1.414l7-7a1 1 0 0 0 0-1.414l-7-7a1 1 0 0 0-1.414 0Z" fill="oklch(var(--gray-95) / 0.5)"/></svg>
            </div>
          </Drawer.Trigger>
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
                <div style="margin-right: var(--gap-x04); display:flex; width: fit-content;">
                    <svg style="padding: 2px" width="24" height="24" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M15.707 4.293a1 1 0 0 1 0 1.414L9.414 12l6.293 6.293a1 1 0 0 1-1.414 1.414l-7-7a1 1 0 0 1 0-1.414l7-7a1 1 0 0 1 1.414 0Z" fill="oklch(var(--primary))"/></svg>
                    <div style="color:oklch(var(--primary));">back</div>
                </div>
              </Drawer.Close>         
              {props.children}
              <Drawer.Description></Drawer.Description>
            </Drawer.Content>
          </Drawer.Portal>
        </>
      )}
    </Drawer>
  )
}

export default DrawerComponent