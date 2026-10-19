using FluentValidation;
using StockHub.Services;

namespace StockHub.Controllers.Stocks;

public class StockPutDtoValidator : StockBaseDtoValidator<StockPutDto>
{
    public StockPutDtoValidator(TickerIdParser tickerIdParser)
    {
        RuleFor(x => x.StockId)
            .NotEmpty()
            .MaximumLength(20);

        RuleFor(x => x.StockId)
            .Must(stockId => tickerIdParser.TryParseExact(stockId, out _))
            .WithMessage("Invalid Stock Id format");

        RuleFor(x => x.Version)
            .NotEqual(0u)
            .WithMessage("Row version is required");
    }
}