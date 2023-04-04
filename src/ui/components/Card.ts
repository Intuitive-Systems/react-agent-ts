import { BaseComponent } from "./base";

interface CardProps {
    title: string;
    content: string;
    imageSrc: string;
    imageAlt: string;
}
export class CardComponent extends BaseComponent<CardProps>  {
    constructor() {
        super("Card", "A card component, designed to display information in a card format on the frontend. Card[title, content, imageSrc, imageAlt]");
    }
    
    async call(input: string) {
        const [title, content, imageSrc, imageAlt] = input.split(",");
        return {
            title,
            content,
            imageSrc,
            imageAlt
        };
    }
}