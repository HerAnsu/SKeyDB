import {render, screen} from '@testing-library/react'

import {TimelineRichText} from './TimelineRichText'

describe('TimelineRichText', () => {
  it('renders the shared timeline copy subset safely', () => {
    const {container} = render(
      <p>
        <TimelineRichText
          text={'Plain *italic* **bold**\n[Link](https://example.com) <em>raw</em>'}
        />
      </p>,
    )

    expect(container.querySelector('em')).toHaveTextContent('italic')
    expect(container.querySelector('strong')).toHaveTextContent('bold')
    expect(container.querySelector('br')).toBeInTheDocument()
    expect(screen.getByRole('link', {name: 'Link'})).toHaveAttribute('href', 'https://example.com')
    expect(screen.getByText(/<em>raw<\/em>/)).toBeInTheDocument()
  })
})
