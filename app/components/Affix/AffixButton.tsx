import { IconArrowUp } from "@tabler/icons-react";
import { useWindowScroll } from "@mantine/hooks";
import { Affix, Button, Transition } from "@mantine/core";

const AffixButton = () => {
  const [scroll, scrollTo] = useWindowScroll();

  return (
    <Affix position={{ bottom: 20, right: 20 }}>
      <Transition transition="slide-up" mounted={scroll.y > 0}>
        {(transitionStyles) => (
          <div
          style={{
            ...transitionStyles,
            backdropFilter: "blur(10px)",
          }}
        >
          <Button
            leftSection={<IconArrowUp size={16} />}
            variant="light"
            style={transitionStyles}
            onClick={() => scrollTo({ y: 0 })}
          >
            Subir
          </Button>
        </div>
        )}
      </Transition>
    </Affix>
  );
};

export default AffixButton;
