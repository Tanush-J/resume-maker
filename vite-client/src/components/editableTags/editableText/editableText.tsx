import { useEffect, useRef, type ElementType, type FormEvent } from "react";

type AllowedTextTags =
    "p"
  | "span"
  | "div"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "strong"
  | "em"
  | "i"
  | "b"
  | "li"
  | "ul"
  | "small"
  | "u"
  | "sub"
  | "sup"
  | "mark"
  | "blockquote";
type SafeHTMLElementTagNameMap = Pick<HTMLElementTagNameMap, AllowedTextTags>;

interface EditableTextProps {
  value: string;
  onChange?: (newValue: string) => void;
  tag: keyof SafeHTMLElementTagNameMap;
  className?: string;
  editable: boolean;
}

const EditableText = ({
  value,
  onChange,
  tag = "p",
  className = "",
  editable = true,
  ...restProps
}: EditableTextProps) => {
  const Tag: ElementType = tag;
  const tagRef = useRef<HTMLElement | null>(null);
  const setTagRef = (element: Element | null) => {
    tagRef.current = element as HTMLElement | null;
  };

  useEffect(() => {
    const element = tagRef.current;

    if (element && document.activeElement !== element && element.innerText !== value) {
      element.innerText = value;
    }
  }, [value, editable]);

  const handleInput = (e: FormEvent<HTMLElement>) => {
    onChange?.(e.currentTarget.innerText);
  };

  return (
    <Tag
      ref={setTagRef}
      className={className}
      contentEditable={editable}
      suppressContentEditableWarning
      onInput={handleInput}
      {...restProps}
    />
  );
};

export default EditableText;
