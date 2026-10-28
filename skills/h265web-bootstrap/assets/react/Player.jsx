import {useEffect, useRef} from 'react';
import {createDemo} from '../common/h265web-demo.js';
import {demoConfig} from '../demo-config.js';

export default function Player({source = demoConfig.mediaUrl}) {
  const root = useRef(null);
  const session = useRef({});
  useEffect(() => {
    const demo = createDemo(root.current, {...demoConfig, mediaUrl: source, sessionState:session.current});
    return () => { void demo.destroy().catch(error => console.error(error.message)); };
  }, [source]);
  return <div ref={root}/>;
}
