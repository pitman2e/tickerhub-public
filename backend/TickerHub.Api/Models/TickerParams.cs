using System;

namespace StockHub.Models;

public readonly record struct TickerParams
{
    public string Value { get; }
    public string RawId { get; }
    public string MarketId { get; }

    public TickerParams(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException("Ticker Id must contain a Ticker identifier and exchange suffix", nameof(value));
        }

        var separatorIndex = value.LastIndexOf('.');
        if (separatorIndex <= 0 || separatorIndex == value.Length - 1)
        {
            throw new ArgumentException("Ticker Id must contain a Ticker identifier and exchange suffix", nameof(value));
        }

        Value = value;
        RawId = value[..separatorIndex];
        MarketId = value[(separatorIndex + 1)..];
    }

    public override string ToString() => Value;
}